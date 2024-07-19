import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput, TerraformVariable, Fn, CloudBackend, NamedCloudWorkspace} from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { dataAwsAmi, launchTemplate } from '@cdktf/provider-aws'
import { autoscalingGroup } from '@cdktf/provider-aws'
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { DataAwsSecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version";
import { DataAwsMskCluster } from "@cdktf/provider-aws/lib/data-aws-msk-cluster";

const instanceTypes = ["c1.medium", "c1.xlarge", "c3.large", "c3.xlarge", "c3.2xlarge", "c3.4xlarge", "c3.8xlarge", "c4.large", "c4.xlarge", "c4.2xlarge", "c4.4xlarge", "c4.8xlarge", "c5.large", "c5.xlarge", "c5.2xlarge", "c5.4xlarge", "c5.9xlarge", "c5.12xlarge", "c5.18xlarge", "c5.24xlarge", "c5.metal", "c5a.large", "c5a.xlarge", "c5a.2xlarge", "c5a.4xlarge", "c5a.8xlarge", "c5a.12xlarge", "c5a.16xlarge", "c5a.24xlarge", "c5ad.large", "c5ad.xlarge", "c5ad.2xlarge", "c5ad.4xlarge", "c5ad.8xlarge", "c5ad.12xlarge", "c5ad.16xlarge", "c5ad.24xlarge", "c5d.large", "c5d.xlarge", "c5d.2xlarge", "c5d.4xlarge", "c5d.9xlarge", "c5d.12xlarge", "c5d.18xlarge", "c5d.24xlarge", "c5d.metal", "c5n.large", "c5n.xlarge", "c5n.2xlarge", "c5n.4xlarge", "c5n.9xlarge", "c5n.18xlarge", "c5n.metal", "c6a.large", "c6a.xlarge", "c6a.2xlarge", "c6a.4xlarge", "c6a.8xlarge", "c6a.12xlarge", "c6a.16xlarge", "c6a.24xlarge", "c6a.32xlarge", "c6a.48xlarge", "c6a.metal", "c6i.large", "c6i.xlarge", "c6i.2xlarge", "c6i.4xlarge", "c6i.8xlarge", "c6i.12xlarge", "c6i.16xlarge", "c6i.24xlarge", "c6i.32xlarge", "c6i.metal", "c6id.large", "c6id.xlarge", "c6id.2xlarge", "c6id.4xlarge", "c6id.8xlarge", "c6id.12xlarge", "c6id.16xlarge", "c6id.24xlarge", "c6id.32xlarge", "c6id.metal", "c6in.large", "c6in.xlarge", "c6in.2xlarge", "c6in.4xlarge", "c6in.8xlarge", "c6in.12xlarge", "c6in.16xlarge", "c6in.24xlarge", "c6in.32xlarge", "cc1.4xlarge", "cc2.8xlarge", "cg1.4xlarge", "cr1.8xlarge", "d2.xlarge", "d2.2xlarge", "d2.4xlarge", "d2.8xlarge", "d3.xlarge", "d3.2xlarge", "d3.4xlarge", "d3.8xlarge", "d3en.xlarge", "d3en.2xlarge", "d3en.4xlarge", "d3en.6xlarge", "d3en.8xlarge", "d3en.12xlarge", "dl1.24xlarge", "f1.2xlarge", "f1.4xlarge", "f1.16xlarge", "g2.2xlarge", "g2.8xlarge", "g3.4xlarge", "g3.8xlarge", "g3.16xlarge", "g3s.xlarge", "g4ad.xlarge", "g4ad.2xlarge", "g4ad.4xlarge", "g4ad.8xlarge", "g4ad.16xlarge", "g4dn.xlarge", "g4dn.2xlarge", "g4dn.4xlarge", "g4dn.8xlarge", "g4dn.12xlarge", "g4dn.16xlarge", "g4dn.metal", "g5.xlarge", "g5.2xlarge", "g5.4xlarge", "g5.8xlarge", "g5.12xlarge", "g5.16xlarge", "g5.24xlarge", "g5.48xlarge", "h1.2xlarge", "h1.4xlarge", "h1.8xlarge", "h1.16xlarge", "hi1.4xlarge", "hpc6a.48xlarge", "hpc6id.32xlarge", "hs1.8xlarge", "i2.xlarge", "i2.2xlarge", "i2.4xlarge", "i2.8xlarge", "i3.large", "i3.xlarge", "i3.2xlarge", "i3.4xlarge", "i3.8xlarge", "i3.16xlarge", "i3.metal", "i3en.large", "i3en.xlarge", "i3en.2xlarge", "i3en.3xlarge", "i3en.6xlarge", "i3en.12xlarge", "i3en.24xlarge", "i3en.metal", "i4i.large", "i4i.xlarge", "i4i.2xlarge", "i4i.4xlarge", "i4i.8xlarge", "i4i.16xlarge", "i4i.32xlarge", "i4i.metal", "inf1.xlarge", "inf1.2xlarge", "inf1.6xlarge", "inf1.24xlarge", "inf2.xlarge", "inf2.8xlarge", "inf2.24xlarge", "inf2.48xlarge", "m1.small", "m1.medium", "m1.large", "m1.xlarge", "m2.xlarge", "m2.2xlarge", "m2.4xlarge", "m3.medium", "m3.large", "m3.xlarge", "m3.2xlarge", "m4.large", "m4.xlarge", "m4.2xlarge", "m4.4xlarge", "m4.10xlarge", "m4.16xlarge", "m5.large", "m5.xlarge", "m5.2xlarge", "m5.4xlarge", "m5.8xlarge", "m5.12xlarge", "m5.16xlarge", "m5.24xlarge", "m5.metal", "m5a.large", "m5a.xlarge", "m5a.2xlarge", "m5a.4xlarge", "m5a.8xlarge", "m5a.12xlarge", "m5a.16xlarge", "m5a.24xlarge", "m5ad.large", "m5ad.xlarge", "m5ad.2xlarge", "m5ad.4xlarge", "m5ad.8xlarge", "m5ad.12xlarge", "m5ad.16xlarge", "m5ad.24xlarge", "m5d.large", "m5d.xlarge", "m5d.2xlarge", "m5d.4xlarge", "m5d.8xlarge", "m5d.12xlarge", "m5d.16xlarge", "m5d.24xlarge", "m5d.metal", "m5dn.large", "m5dn.xlarge", "m5dn.2xlarge", "m5dn.4xlarge", "m5dn.8xlarge", "m5dn.12xlarge", "m5dn.16xlarge", "m5dn.24xlarge", "m5dn.metal", "m5n.large", "m5n.xlarge", "m5n.2xlarge", "m5n.4xlarge", "m5n.8xlarge", "m5n.12xlarge", "m5n.16xlarge", "m5n.24xlarge", "m5n.metal", "m5zn.large", "m5zn.xlarge", "m5zn.2xlarge", "m5zn.3xlarge", "m5zn.6xlarge", "m5zn.12xlarge", "m5zn.metal", "m6a.large", "m6a.xlarge", "m6a.2xlarge", "m6a.4xlarge", "m6a.8xlarge", "m6a.12xlarge", "m6a.16xlarge", "m6a.24xlarge", "m6a.32xlarge", "m6a.48xlarge", "m6a.metal", "m6i.large", "m6i.xlarge", "m6i.2xlarge", "m6i.4xlarge", "m6i.8xlarge", "m6i.12xlarge", "m6i.16xlarge", "m6i.24xlarge", "m6i.32xlarge", "m6i.metal", "m6id.large", "m6id.xlarge", "m6id.2xlarge", "m6id.4xlarge", "m6id.8xlarge", "m6id.12xlarge", "m6id.16xlarge", "m6id.24xlarge", "m6id.32xlarge", "m6id.metal", "m6idn.large", "m6idn.xlarge", "m6idn.2xlarge", "m6idn.4xlarge", "m6idn.8xlarge", "m6idn.12xlarge", "m6idn.16xlarge", "m6idn.24xlarge", "m6idn.32xlarge", "m6in.large", "m6in.xlarge", "m6in.2xlarge", "m6in.4xlarge", "m6in.8xlarge", "m6in.12xlarge", "m6in.16xlarge", "m6in.24xlarge", "m6in.32xlarge", "p2.xlarge", "p2.8xlarge", "p2.16xlarge", "p3.2xlarge", "p3.8xlarge", "p3.16xlarge", "p3dn.24xlarge", "p4d.24xlarge", "r3.large", "r3.xlarge", "r3.2xlarge", "r3.4xlarge", "r3.8xlarge", "r4.large", "r4.xlarge", "r4.2xlarge", "r4.4xlarge", "r4.8xlarge", "r4.16xlarge", "r5.large", "r5.xlarge", "r5.2xlarge", "r5.4xlarge", "r5.8xlarge", "r5.12xlarge", "r5.16xlarge", "r5.24xlarge", "r5.metal", "r5a.large", "r5a.xlarge", "r5a.2xlarge", "r5a.4xlarge", "r5a.8xlarge", "r5a.12xlarge", "r5a.16xlarge", "r5a.24xlarge", "r5ad.large", "r5ad.xlarge", "r5ad.2xlarge", "r5ad.4xlarge", "r5ad.8xlarge", "r5ad.12xlarge", "r5ad.16xlarge", "r5ad.24xlarge", "r5b.large", "r5b.xlarge", "r5b.2xlarge", "r5b.4xlarge", "r5b.8xlarge", "r5b.12xlarge", "r5b.16xlarge", "r5b.24xlarge", "r5b.metal", "r5d.large", "r5d.xlarge", "r5d.2xlarge", "r5d.4xlarge", "r5d.8xlarge", "r5d.12xlarge", "r5d.16xlarge", "r5d.24xlarge", "r5d.metal", "r5dn.large", "r5dn.xlarge", "r5dn.2xlarge", "r5dn.4xlarge", "r5dn.8xlarge", "r5dn.12xlarge", "r5dn.16xlarge", "r5dn.24xlarge", "r5dn.metal", "r5n.large", "r5n.xlarge", "r5n.2xlarge", "r5n.4xlarge", "r5n.8xlarge", "r5n.12xlarge", "r5n.16xlarge", "r5n.24xlarge", "r5n.metal", "r6a.large", "r6a.xlarge", "r6a.2xlarge", "r6a.4xlarge", "r6a.8xlarge", "r6a.12xlarge", "r6a.16xlarge", "r6a.24xlarge", "r6a.32xlarge", "r6a.48xlarge", "r6a.metal", "r6i.large", "r6i.xlarge", "r6i.2xlarge", "r6i.4xlarge", "r6i.8xlarge", "r6i.12xlarge", "r6i.16xlarge", "r6i.24xlarge", "r6i.32xlarge", "r6i.metal", "r6id.large", "r6id.xlarge", "r6id.2xlarge", "r6id.4xlarge", "r6id.8xlarge", "r6id.12xlarge", "r6id.16xlarge", "r6id.24xlarge", "r6id.32xlarge", "r6id.metal", "r6idn.large", "r6idn.xlarge", "r6idn.2xlarge", "r6idn.4xlarge", "r6idn.8xlarge", "r6idn.12xlarge", "r6idn.16xlarge", "r6idn.24xlarge", "r6idn.32xlarge", "r6in.large", "r6in.xlarge", "r6in.2xlarge", "r6in.4xlarge", "r6in.8xlarge", "r6in.12xlarge", "r6in.16xlarge", "r6in.24xlarge", "r6in.32xlarge", "t1.micro", "t2.nano", "t2.micro", "t2.small", "t2.medium", "t2.large", "t2.xlarge", "t2.2xlarge", "t3.nano", "t3.micro", "t3.small", "t3.medium", "t3.large", "t3.xlarge", "t3.2xlarge", "t3a.nano", "t3a.micro", "t3a.small", "t3a.medium", "t3a.large", "t3a.xlarge", "t3a.2xlarge", "trn1.2xlarge", "trn1.32xlarge", "trn1n.32xlarge", "u-12tb1.112xlarge", "u-12tb1.metal", "u-18tb1.112xlarge", "u-18tb1.metal", "u-24tb1.112xlarge", "u-24tb1.metal", "u-3tb1.56xlarge", "u-6tb1.56xlarge", "u-6tb1.112xlarge", "u-6tb1.metal", "u-9tb1.112xlarge", "u-9tb1.metal", "vt1.3xlarge", "vt1.6xlarge", "vt1.24xlarge", "x1.16xlarge", "x1.32xlarge", "x1e.xlarge", "x1e.2xlarge", "x1e.4xlarge", "x1e.8xlarge", "x1e.16xlarge", "x1e.32xlarge", "x2idn.16xlarge", "x2idn.24xlarge", "x2idn.32xlarge", "x2idn.metal", "x2iedn.xlarge", "x2iedn.2xlarge", "x2iedn.4xlarge", "x2iedn.8xlarge", "x2iedn.16xlarge", "x2iedn.24xlarge", "x2iedn.32xlarge", "x2iedn.metal", "x2iezn.2xlarge", "x2iezn.4xlarge", "x2iezn.6xlarge", "x2iezn.8xlarge", "x2iezn.12xlarge", "x2iezn.metal", "z1d.large", "z1d.xlarge", "z1d.2xlarge", "z1d.3xlarge", "z1d.6xlarge", "z1d.12xlarge", "z1d.metal"];

class ZillaPlusPublicAccessUnauthorizedSaslStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const awsProvider = new AwsProvider(this, "AWS", {
      region: "us-east-1",
      accessKey: "ASIAWPRT43PNLF2ZOPPZ",
      secretKey: "jQb/xIz68J0ijIqmU1TlzbcdxUkNL1dx+j37SVUm",
      token: "IQoJb3JpZ2luX2VjEFcaCXVzLXdlc3QtMiJGMEQCIByTnl0ZLbwseZh0CA1nm/AX2uXwInuOjffjqW8diwPgAiBC8ecrJRUcqtw0bGLYXci+wRf48iYl/aQqwL9F4m12VCqGAwgwEAMaDDQ0NTcxMTcwMzAwMiIM9c4haee+RsXnFQHrKuMCjGsrmcF3IXeqwd1qOLF4uVQCeTlXohUayHaYRqWroImk+U/JdKqjTCnDe8Q23EwwvA9U71xYdWOUNMnfFRxI6mmD+F1LD65I9mqvwZ3atOxBIZiViC6gevlVD6KrJrMRxBdjuHyYpQCW3MUktrlPJ/9XdhZbbOEbFFjjSrn7Vqb07v9mmMqv8FfJjE7AKxr+PUTyWAJsIEIDfY1kJVO11kQ7+cpZZU/s1uzTZAT7BkvjEb24tdcWDa/wsKeFATVNgf9KMe0orfUwT3p5dSgvLEqSIw6ibheAq7eNuQaqBQRlkeF6JXFGkZa9m7w99P7KsmNT8Ijq5ac5ShlvI1DAKFWBM9xj0KdkaIj3aUpKA2jVoZuM/5WaobvTUD12hFZUR62nP0RlN1ADG5q/Pri/VOuw5o+h5rt13QKT05GRjUpkthE4EDAVWd+n4ufntOz9jZ441RqJ44AhhICAZaKi+1pkFzCO+Om0BjqnAXg6j/wtd5sYuI11x0kI7AeUq5IdRDhbqSZl/PUGNBE99UtttXaqE5Sj/+6/grLf+jS1GVuW0YjO34ncVyV2bnnDOcGWLe8KMK5UwX9TgNqhPot/6jR8arPWAnt9NrdWunCqXgoFpyompbaTLjKeYbQ+/2OaAMWDuwVw90UXblHzMVA7pHGGR1pQh2Ok2lZ9PRdYWotQjp6Qops8D1G1kQpiCPkEs74Y"
    });

    const vpcId = new TerraformVariable(this, 'vpcId', {
      type: 'string',
      description: 'VpcId of your existing Virtual Private Cloud (VPC)',
    });

    const subnetIds = new TerraformVariable(this, 'subnetIds', {
      type: 'list(string)',
      description: 'The list of SubnetIds in your Virtual Private Cloud (VPC)',
    });

    const mskClusterName = new TerraformVariable(this, 'mskClusterName', {
      type: 'string',
      description: 'The name of the MSK cluster'
    });

    const mskAccessMethod = new TerraformVariable(this, 'mskAccessMethod', {
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

    const zillaPlusCapacity = new TerraformVariable(this, 'zillaPlusCapacity', {
      type: 'number',
      default: 2,
      description: 'The initial number of Zilla Plus instances'
    });

    const zillaPlusRole = new TerraformVariable(this, 'zillaPlusRole', {
      type: 'string',
      description: 'The role name assumed by Zilla Plus instances.',
    });

    const zillaPlusSecurityGroups = new TerraformVariable(this, 'zillaPlusSecurityGroups', {
      type: 'list(string)',
      description: 'The security groups associated with Zilla Plus instances.',
    });

    const publicPort = new TerraformVariable(this, 'publicPort', {
      type: 'number',
      default: 9094,
      description: 'The public port number to be used by Kafka clients',
    });

    const publicWildcardDNS = new TerraformVariable(this, 'publicWildcardDNS', {
      type: 'string',
      description: 'The public wildcard DNS pattern for bootstrap servers to be used by Kafka clients'
    });

    const publicTlsCertificateKey = new TerraformVariable(this, 'publicTlsCertificateKey', {
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
      const keyNameVar = new TerraformVariable(this, 'keyName', {
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

      const cloudWatchLogsGroup = new TerraformVariable(this, 'cloudWatchLogsGroup', {
        type: 'string',
        description: 'The Cloud Watch log group Zilla Plush should publish logs',
        default: defaultLogGroupName
      });
  
      const cloudWatchMetricsNamespace = new TerraformVariable(this, 'cloudWatchMetricsNamespace', {
        type: 'string',
        description: 'The Cloud Watch metrics namespace Zilla Plush should publish metrics',
        default: defaultMetricNamespace
      });


      new CloudwatchLogGroup(this, `loggroup`, {
        name: cloudWatchLogsGroup.stringValue
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
    

    const instanceType = new TerraformVariable(this, 'instanceType', {
      type: 'string',
      default: 't3.small',
      description: 'Zilla Plus EC2 instance type'
    });
    instanceType.addValidation({
      condition: `${Fn.contains(instanceTypes, instanceType.stringValue)}`,
      errorMessage: 'must be a valid EC2 instance type.'
    })

    const ami = new dataAwsAmi.DataAwsAmi(this, 'LatestAmi', {
      mostRecent: true,
      nameRegex: 'Aklivity Zilla Plus*',
      filter: [{
        name: 'is-public',
        values: ['true']
      }],
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

const stack = new ZillaPlusPublicAccessUnauthorizedSaslStack(app, "secure-public-access-unauthorized-sasl");
new CloudBackend(stack, {
  hostname: "app.terraform.io",
  organization: "Aklivity",
  workspaces: new NamedCloudWorkspace("secure-public-access-unauthorized-sasl")
});
app.synth();
