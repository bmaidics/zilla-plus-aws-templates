import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput, TerraformVariable, Fn} from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { dataAwsAmi, launchTemplate } from '@cdktf/provider-aws'
import { autoscalingGroup } from '@cdktf/provider-aws'
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { DataAwsSecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version";
import { DataAwsMskCluster } from "@cdktf/provider-aws/lib/data-aws-msk-cluster";
import { DataAwsCloudwatchLogGroup } from "@cdktf/provider-aws/lib/data-aws-cloudwatch-log-group";
import instanceTypes from "./instance-types";

export class ZillaPlusSecurePublicAccessUnauthorizedSaslStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const awsProvider = new AwsProvider(this, "AWS", {
    });

    const vpcId = new TerraformVariable(this, 'vpc_id', {
      type: 'string',
      description: 'VpcId of your existing Virtual Private Cloud (VPC)',
    });

    const subnetIds = new TerraformVariable(this, 'subnet_ids', {
      type: 'list(string)',
      description: 'The list of SubnetIds in your Virtual Private Cloud (VPC)',
    });

    const mskClusterName = new TerraformVariable(this, 'msk_cluster_name', {
      type: 'string',
      description: 'The name of the MSK cluster'
    });

    const mskAccessMethod = new TerraformVariable(this, 'msk_access_method', {
      type: 'string',
      description: 'The access method used by Zilla Plus to connect to the MSK cluster ["SASL/SCRAM", "Unauthenticated"]'
    });
    mskAccessMethod.addValidation({
      condition: `${Fn.contains(["SASL/SCRAM", "Unauthenticated"], mskAccessMethod.stringValue)}`,
      errorMessage: 'must be a valid EC2 instance type.'
    })

    const mskCluster = new DataAwsMskCluster(this, 'MSKCluster', {
      clusterName: mskClusterName.stringValue
    });

    const MSK_ACCESS_METHOD = process.env.MSK_ACCESS_METHOD == "" ? "Unauthorized" : process.env.MSK_ACCESS_METHOD;

    const bootstrapServers = Fn.conditional(MSK_ACCESS_METHOD === "SASL/SCRAM", mskCluster.bootstrapBrokersSaslScram, mskCluster.bootstrapBrokers);
    const domainParts = Fn.split(':', Fn.element(Fn.split(',', bootstrapServers), 0));
    const serverAddress = Fn.element(domainParts, 0);
    const mskPort = Fn.element(domainParts, 1);
    const addressParts = Fn.split('.', serverAddress);
    const mskBootstrapCommonPart = Fn.join('.', Fn.slice(addressParts, 1, Fn.lengthOf(addressParts)));
    const mskWildcardDNS = Fn.format('*.%s', [mskBootstrapCommonPart]);

    const zillaPlusCapacity = new TerraformVariable(this, 'zilla_plus_capacity', {
      type: 'number',
      default: 2,
      description: 'The initial number of Zilla Plus instances'
    });

    const zillaPlusRole = new TerraformVariable(this, 'zilla_plus_role', {
      type: 'string',
      description: 'The role name assumed by Zilla Plus instances.',
    });

    const zillaPlusSecurityGroups = new TerraformVariable(this, 'zilla_plus_security_groups', {
      type: 'list(string)',
      description: 'The security groups associated with Zilla Plus instances.',
    });

    const publicPort = new TerraformVariable(this, 'public_port', {
      type: 'number',
      default: 9094,
      description: 'The public port number to be used by Kafka clients',
    });

    const publicWildcardDNS = new TerraformVariable(this, 'public_wildcard_dns', {
      type: 'string',
      description: 'The public wildcard DNS pattern for bootstrap servers to be used by Kafka clients'
    });

    const publicTlsCertificateKey = new TerraformVariable(this, 'public_tls_certificate_key', {
      type: 'string',
      description: 'TLS Certificate Private Key Secret ARN'
    });
    // Validate that the Certificate Key exists
    new DataAwsSecretsmanagerSecretVersion(this, 'publicTlsCertificate', {
      secretId: publicTlsCertificateKey.stringValue,
    });

    const SSH_KEY_ENABLED = process.env.SSH_KEY_ENABLED === "true";
    let keyName = '';

    if (SSH_KEY_ENABLED)
    {
      const keyNameVar = new TerraformVariable(this, 'key_name', {
        type: 'string',
        description: 'Name of an existing EC2 KeyPair to enable SSH access to the instances'
      });
      keyName = keyNameVar.stringValue;
    }

    const CLOUDWATCH_ENABLED = process.env.CLOUDWATCH_ENABLED === "true";

    let zillaTelemetryContent = "";
    let bindingTelemetryContent = ""; 


    if (CLOUDWATCH_ENABLED)
    {
      const defaultLogGroupName = `${id}-group`;
      const defaultMetricNamespace = `${id}-namespace`;

      const cloudWatchLogsGroup = new TerraformVariable(this, 'cloudwatch_logs_group', {
        type: 'string',
        description: 'The Cloud Watch log group Zilla Plush should publish logs',
        default: defaultLogGroupName
      });
  
      const cloudWatchMetricsNamespace = new TerraformVariable(this, 'cloudwatch_metrics_namespace', {
        type: 'string',
        description: 'The Cloud Watch metrics namespace Zilla Plush should publish metrics',
        default: defaultMetricNamespace
      });


      const existingLogGroup = new DataAwsCloudwatchLogGroup(this, 'existingLogGroup', {
        name: cloudWatchLogsGroup.stringValue
      });

      new CloudwatchLogGroup(this, `loggroup`, {
        name: cloudWatchLogsGroup.stringValue,
        dependsOn: [existingLogGroup],
        skipDestroy: true,
        count: existingLogGroup.arn ? 0 : 1
      });

      const logsSection = `
        logs:
          group: ${cloudWatchLogsGroup.stringValue}
          stream: events`;
    
  
      const metricsSection = `
        metrics:
          namespace: ${cloudWatchMetricsNamespace.stringValue}`;

      zillaTelemetryContent = `
telemetry:
  exporters:
    aws0:
      type: aws-cloudwatch
      options:
${logsSection}
${metricsSection}`;

        bindingTelemetryContent = `
    telemetry:
      metrics:
        - stream.*`;

      }
    

    const instanceType = new TerraformVariable(this, 'instance_type', {
      type: 'string',
      default: 't3.small',
      description: 'Zilla Plus EC2 instance type'
    });
    instanceType.addValidation({
      condition: `${Fn.contains(instanceTypes.instanceTypes, instanceType.stringValue)}`,
      errorMessage: 'must be a valid EC2 instance type.'
    })

    const ami = new dataAwsAmi.DataAwsAmi(this, 'LatestAmi', {
      mostRecent: true,
      filter: [
        {
          name: "product-code",
          values: ["ca5mgk85pjtbyuhtfluzisgzy"],
        },
        {
          name: 'is-public',
          values: ['true']
        }
      ],
      owners: ['679593333241']
    });

    const region = awsProvider.region ?? "us-east-1";

    const nlb = new Lb(this, 'NetworkLoadBalancer', {
      name: 'network-load-balancer',
      loadBalancerType: 'network',
      internal: false,
      subnets: subnetIds.listValue,
      enableCrossZoneLoadBalancing: true,
    });

    const nlbTargetGroup = new LbTargetGroup(this, 'NLBTargetGroup', {
      name: 'nlb-target-group',
      port: publicPort.value,
      protocol: 'TCP',
      vpcId: vpcId.value,
    });

    new LbListener(this, 'NLBListener', {
      loadBalancerArn: nlb.arn,
      port: publicPort.value,
      protocol: 'TCP',
      defaultAction: [{
        type: 'forward',
        targetGroupArn: nlbTargetGroup.arn,
      }],
    });

    const externalHost = [
      'b-#.',
      Fn.element(Fn.split('*.', publicWildcardDNS.stringValue), 1)
    ].join('');
    
    const internalHost = [
      'b-#.',
      Fn.element(Fn.split('*.', mskWildcardDNS), 1),
    ].join('');


    const zillaYamlContent = `
name: public
vaults:
  secure:
    type: aws
${zillaTelemetryContent}
bindings:
  tcp_server:
    type: tcp
    kind: server
    options:
      host: 0.0.0.0
      port: ${publicPort}
${bindingTelemetryContent}
    exit: tls_server
  tls_server:
    type: tls
    kind: server
    vault: secure
    options:
      keys:
      - ${publicTlsCertificateKey.stringValue}
    routes:
    - exit: kafka_proxy
      when:
      - authority: '${publicWildcardDNS.stringValue}'
  kafka_proxy:
    type: kafka-proxy
    kind: proxy
    options:
      external:
        host: '${externalHost}'
        port: ${publicPort}
      internal:
        host: '${internalHost}'
        port:  ${mskPort}
    exit: tls_client
  tls_client:
    type: tls
    kind: client
    vault: secure
    options:
      trustcacerts: true
    exit: tcp_client
  tcp_client:
    type: tcp
    kind: client
    options:
      host: '*'
      port: ${mskPort}
    routes:
    - when:
      - authority: '${mskWildcardDNS}'
    `;

    
        const cfnHupConfContent = `
[main]
stack=${id}
region=${region}
    `;
    
        const cfnAutoReloaderConfContent = `
[cfn-auto-reloader-hook]
triggers=post.update
path=Resources.ZillaPlusLaunchTemplate.Metadata.AWS::CloudFormation::Init
action=/opt/aws/bin/cfn-init -v --stack ${id} --resource ZillaPlusLaunchTemplate --region ${region}
runas=root
    `;
    
        const userData = `#!/bin/bash -xe
yum update -y aws-cfn-bootstrap
cat <<EOF > /etc/zilla/zilla.yaml
${zillaYamlContent}
EOF

chown ec2-user:ec2-user /etc/zilla/zilla.yaml

mkdir /etc/cfn
cat <<EOF > /etc/cfn/cfn-hup.conf
${cfnHupConfContent}
EOF

chown root:root /etc/cfn/cfn-hup.conf
chmod 0400 /etc/cfn/cfn-hup.conf

mkdir /etc/cfn/hooks.d
cat <<EOF > /etc/cfn/hooks.d/cfn-auto-reloader.conf
${cfnAutoReloaderConfContent}
EOF

chown root:root /etc/cfn/hooks.d/cfn-auto-reloader.conf
chmod 0400 /etc/cfn/hooks.d/cfn-auto-reloader.conf

systemctl enable cfn-hup
systemctl start cfn-hup
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
systemctl enable zilla-plus
systemctl start zilla-plus

    `;
        
    const ZillaPlusLaunchTemplate = new launchTemplate.LaunchTemplate(this, 'ZillaPlusLaunchTemplate', {
      imageId: ami.imageId,
      instanceType: instanceType.stringValue,
      networkInterfaces: [
        {
          associatePublicIpAddress: 'true',
          deviceIndex: 0,
          securityGroups: zillaPlusSecurityGroups.listValue
        },
      ],
      iamInstanceProfile: {
        name: zillaPlusRole.stringValue
      },
      keyName: keyName,
      userData: Fn.base64encode(userData)
    });

    new autoscalingGroup.AutoscalingGroup(this, 'ZillaPlusGroup', {
      vpcZoneIdentifier: subnetIds.listValue,
      launchTemplate: {
        id: ZillaPlusLaunchTemplate.id
      },
      minSize: 1,
      maxSize: 5,
      desiredCapacity: zillaPlusCapacity.numberValue,
      targetGroupArns: [nlbTargetGroup.arn]
    });

    new TerraformOutput(this, 'NetworkLoadBalancerOutput', {
      description: 'Public DNS name of newly created NLB for Zilla Plus',
      value: nlb.dnsName,
    });
  }
}

const app = new App();

new ZillaPlusSecurePublicAccessUnauthorizedSaslStack(app, "secure-public-access-unauthorized-sasl");
app.synth();
