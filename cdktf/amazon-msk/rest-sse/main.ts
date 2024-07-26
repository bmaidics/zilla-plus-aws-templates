import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput, TerraformVariable, Fn} from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { dataAwsAmi, launchTemplate } from '@cdktf/provider-aws'
import { autoscalingGroup } from '@cdktf/provider-aws'
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import { DataAwsSecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { DataAwsMskCluster } from "@cdktf/provider-aws/lib/data-aws-msk-cluster";
import { DataAwsCloudwatchLogGroup } from "@cdktf/provider-aws/lib/data-aws-cloudwatch-log-group";
import instanceTypes from "./instance-types";

export class ZillaPlusRestSseStack extends TerraformStack {
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

    const mskAccessCredentialsARN = new TerraformVariable(this, 'msk_access_credentials_arn', {
      type: 'string',
      description: 'The MSK Access Credentials Secret ARN with JSON properties; username, password'
    });
    // Validate that the Credentials exists
    new DataAwsSecretsmanagerSecretVersion(this, 'mskAccessCredentials', {
      secretId: mskAccessCredentialsARN.stringValue,
    });

    const mskClusterName = new TerraformVariable(this, 'msk_cluster_name', {
      type: 'string',
      description: 'The name of the MSK cluster'
    });

    const mskCluster = new DataAwsMskCluster(this, 'MSKCluster', {
      clusterName: mskClusterName.stringValue
    });

    const topic = new TerraformVariable(this, 'kafka_topic', {
      type: 'string',
      description: 'The Kafka topic exposed through REST and SSE',
    });

    let path = `/${topic.stringValue}`;
    const CUSTOM_PATH = process.env.CUSTOM_PATH === "true";

    if (CUSTOM_PATH)
    {
      const pathVar = new TerraformVariable(this, 'path', {
        type: 'string',
        description: 'The path the Kafka topic should be exposed to',
        default: ''
      });
      path = `/${pathVar.stringValue}`;
    }

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

    const publicTcpPort = new TerraformVariable(this, 'public_tcp_port', {
      type: 'number',
      default: 7143,
      description: 'The public port number to be used by REST and SSE clients',
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

    const instanceType = new TerraformVariable(this, 'instance_type', {
      type: 'string',
      default: 't3.small',
      description: 'MSK Proxy EC2 instance type'
    });
    instanceType.addValidation({
      condition: `${Fn.contains(instanceTypes.instanceTypes, instanceType.stringValue)}`,
      errorMessage: 'must be a valid EC2 instance type.'
    })

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
      
      const logsSection = 
`        logs:
          group: ${cloudWatchLogsGroup.stringValue}
          stream: events`;
    
  
      const metricsSection =
`        metrics:
          namespace: ${cloudWatchMetricsNamespace.stringValue}`;

      zillaTelemetryContent = 
`telemetry:
  metrics:
    - stream.active.received
    - stream.active.sent
    - stream.opens.received
    - stream.opens.sent
    - stream.data.received
    - stream.data.sent
    - stream.errors.received
    - stream.errors.sent
    - stream.closes.received
    - stream.closes.sent
  exporters:
    stdout_logs_exporter:
      type: stdout
    aws0:
      type: aws-cloudwatch
      options:
${logsSection}
${metricsSection}`;

    bindingTelemetryContent = 
`    telemetry:
      metrics:
        - stream.*`;
    }


    const GLUE_REGISTRY_ENABLED = process.env.GLUE_REGISTRY_ENABLED === "true";
    let glueContent = '';
    let kafkaCacheClientGlueContent = '';
    let kafkaCacheServerGlueContent = '';

    if (GLUE_REGISTRY_ENABLED)
    {
      const glueRegistry = new TerraformVariable(this, 'glue_registry', {
        type: 'string',
        description: 'The Glue Registry to fetch the schemas from'
      });

      glueContent = 
`catalogs:
  glue_catalog:
    type: aws-glue
    options:
      registry: ${glueRegistry.stringValue}`

      kafkaCacheClientGlueContent = 
`    options:
      topics:
        - name: ${topic}
          value:
            model: avro
            view: json
            catalog:
              glue_catalog:
                - strategy: topic
                  version: latest`
      
      kafkaCacheServerGlueContent = 
`      topics:
        - name: ${topic}
          value:
            model: avro
            view: json
            catalog:
              glue_catalog:
                - strategy: topic
                  version: latest`
    }

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
    });

    const region = awsProvider.region ?? "us-east-1";

    const nlb = new Lb(this, 'NetworkLoadBalancer', {
      name: 'network-load-balancer',
      loadBalancerType: 'network',
      internal: false,
      subnets: subnetIds.listValue,
      securityGroups: zillaPlusSecurityGroups.listValue,
      enableCrossZoneLoadBalancing: true,
    });

    const nlbTargetGroup = new LbTargetGroup(this, 'NLBTargetGroup', {
      name: 'nlb-target-group',
      port: publicTcpPort.value,
      protocol: 'TCP',
      vpcId: vpcId.value,
    });

    new LbListener(this, 'NLBListener', {
      loadBalancerArn: nlb.arn,
      port: publicTcpPort.value,
      protocol: 'TCP',
      defaultAction: [{
        type: 'forward',
        targetGroupArn: nlbTargetGroup.arn,
      }],
    });

    const kafkaSaslUsername = Fn.join('', [
      '${{aws.secrets.',
      mskAccessCredentialsARN.stringValue,
      '#username}}'
    ]);

    const kafkaSaslPassword = Fn.join('', [
      '${{aws.secrets.',
      mskAccessCredentialsARN.stringValue,
      '#password}}'
    ]);

    const kafkaBootstrapServers = `['${Fn.join(`','`, Fn.split(',', mskCluster.bootstrapBrokersSaslScram))}']`;

    const zillaYamlContent = `
name: public
${glueContent}
${zillaTelemetryContent}
vaults:
  secure:
    type: aws
bindings:
  tcp_server:
    type: tcp
    kind: server
${bindingTelemetryContent}
    options:
      host: 0.0.0.0
      port: ${publicTcpPort}
    exit: tls_server
  tls_server:
    type: tls
    kind: server
    vault: secure
${bindingTelemetryContent}
    options:
      keys:
      - ${publicTlsCertificateKey.stringValue}
    exit: north_http_server
  north_http_server:
    type: http
    kind: server
${bindingTelemetryContent}
    routes:
      - when:
          - headers:
              :path: /streams${path}
        exit: north_sse_server
      - when:
          - headers:
              :path: ${path}/*
          - headers:
              :path: ${path}
        exit: north_http_kafka_mapping
  north_sse_server:
    type: sse
    kind: server
${bindingTelemetryContent}
    exit: north_sse_kafka_mapping
  north_sse_kafka_mapping:
    type: sse-kafka
    kind: proxy
${bindingTelemetryContent}
    routes:
      - when:
          - path: /streams${path}
        exit: kafka_cache_client
        with:
          topic: ${topic}
  north_http_kafka_mapping:
    type: http-kafka
    kind: proxy
${bindingTelemetryContent}
    routes:
      - when:
          - method: POST
            path: ${path}
        exit: kafka_cache_client
        with:
          capability: produce
          topic: ${topic.stringValue}
          key: \${idempotencyKey}
      - when:
          - method: PUT
            path: ${path}/{id}
        exit: kafka_cache_client
        with:
          capability: produce
          topic: ${topic.stringValue}
          key: \${params.id}
      - when:
          - method: DELETE
            path: ${path}/{id}
        exit: kafka_cache_client
        with:
          capability: produce
          topic: ${topic.stringValue}
          key: \${params.id}
      - when:
          - method: GET
            path: ${path}
        exit: kafka_cache_client
        with:
          capability: fetch
          topic: ${topic.stringValue}
          merge:
            content-type: application/json
      - when:
          - method: GET
            path: ${path}/{id}
        exit: kafka_cache_client
        with:
          capability: fetch
          topic: ${topic.stringValue}
          filters:
            - key: \${params.id}
  kafka_cache_client:
    type: kafka
    kind: cache_client
${kafkaCacheClientGlueContent}
${bindingTelemetryContent}
    exit: kafka_cache_server
  kafka_cache_server:
    type: kafka
    kind: cache_server
${bindingTelemetryContent}
    options:
      bootstrap:
        - ${topic.stringValue}
${kafkaCacheServerGlueContent}
    exit: kafka_client
  kafka_client:
    type: kafka
    kind: client
    options:
      servers: ${kafkaBootstrapServers}
      sasl:
        mechanism: scram-sha-512
        username: '${kafkaSaslUsername}'
        password: '${kafkaSaslPassword}'
${bindingTelemetryContent}
    exit: tls_client
  tls_client:
    type: tls
    kind: client
    vault: secure
${bindingTelemetryContent}
    exit: tcp_client
  tcp_client:
    type: tcp
    kind: client
${bindingTelemetryContent}
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
cat <<'END_HELP' > /etc/zilla/zilla.yaml
${zillaYamlContent}
END_HELP

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

    new autoscalingGroup.AutoscalingGroup(this, 'zillaPlusGroup', {
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
      description: 'Public DNS name of newly created NLB for Public MSK Proxy',
      value: nlb.dnsName
    });
  }
}

const app = new App();
new ZillaPlusRestSseStack(app, "rest-sse");
app.synth();
