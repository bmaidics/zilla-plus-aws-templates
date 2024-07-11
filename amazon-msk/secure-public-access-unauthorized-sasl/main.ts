import { Construct } from "constructs";
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace, TerraformOutput, TerraformVariable, Fn} from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { launchTemplate } from '@cdktf/provider-aws/lib'
import { autoscalingGroup } from '@cdktf/provider-aws/lib'
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import * as aws from '@cdktf/provider-aws';
import { LaunchTemplate } from "@cdktf/provider-aws/lib/launch-template";

const instanceTypes = ["c1.medium", "c1.xlarge", "c3.large", "c3.xlarge", "c3.2xlarge", "c3.4xlarge", "c3.8xlarge", "c4.large", "c4.xlarge", "c4.2xlarge", "c4.4xlarge", "c4.8xlarge", "c5.large", "c5.xlarge", "c5.2xlarge", "c5.4xlarge", "c5.9xlarge", "c5.12xlarge", "c5.18xlarge", "c5.24xlarge", "c5.metal", "c5a.large", "c5a.xlarge", "c5a.2xlarge", "c5a.4xlarge", "c5a.8xlarge", "c5a.12xlarge", "c5a.16xlarge", "c5a.24xlarge", "c5ad.large", "c5ad.xlarge", "c5ad.2xlarge", "c5ad.4xlarge", "c5ad.8xlarge", "c5ad.12xlarge", "c5ad.16xlarge", "c5ad.24xlarge", "c5d.large", "c5d.xlarge", "c5d.2xlarge", "c5d.4xlarge", "c5d.9xlarge", "c5d.12xlarge", "c5d.18xlarge", "c5d.24xlarge", "c5d.metal", "c5n.large", "c5n.xlarge", "c5n.2xlarge", "c5n.4xlarge", "c5n.9xlarge", "c5n.18xlarge", "c5n.metal", "c6a.large", "c6a.xlarge", "c6a.2xlarge", "c6a.4xlarge", "c6a.8xlarge", "c6a.12xlarge", "c6a.16xlarge", "c6a.24xlarge", "c6a.32xlarge", "c6a.48xlarge", "c6a.metal", "c6i.large", "c6i.xlarge", "c6i.2xlarge", "c6i.4xlarge", "c6i.8xlarge", "c6i.12xlarge", "c6i.16xlarge", "c6i.24xlarge", "c6i.32xlarge", "c6i.metal", "c6id.large", "c6id.xlarge", "c6id.2xlarge", "c6id.4xlarge", "c6id.8xlarge", "c6id.12xlarge", "c6id.16xlarge", "c6id.24xlarge", "c6id.32xlarge", "c6id.metal", "c6in.large", "c6in.xlarge", "c6in.2xlarge", "c6in.4xlarge", "c6in.8xlarge", "c6in.12xlarge", "c6in.16xlarge", "c6in.24xlarge", "c6in.32xlarge", "cc1.4xlarge", "cc2.8xlarge", "cg1.4xlarge", "cr1.8xlarge", "d2.xlarge", "d2.2xlarge", "d2.4xlarge", "d2.8xlarge", "d3.xlarge", "d3.2xlarge", "d3.4xlarge", "d3.8xlarge", "d3en.xlarge", "d3en.2xlarge", "d3en.4xlarge", "d3en.6xlarge", "d3en.8xlarge", "d3en.12xlarge", "dl1.24xlarge", "f1.2xlarge", "f1.4xlarge", "f1.16xlarge", "g2.2xlarge", "g2.8xlarge", "g3.4xlarge", "g3.8xlarge", "g3.16xlarge", "g3s.xlarge", "g4ad.xlarge", "g4ad.2xlarge", "g4ad.4xlarge", "g4ad.8xlarge", "g4ad.16xlarge", "g4dn.xlarge", "g4dn.2xlarge", "g4dn.4xlarge", "g4dn.8xlarge", "g4dn.12xlarge", "g4dn.16xlarge", "g4dn.metal", "g5.xlarge", "g5.2xlarge", "g5.4xlarge", "g5.8xlarge", "g5.12xlarge", "g5.16xlarge", "g5.24xlarge", "g5.48xlarge", "h1.2xlarge", "h1.4xlarge", "h1.8xlarge", "h1.16xlarge", "hi1.4xlarge", "hpc6a.48xlarge", "hpc6id.32xlarge", "hs1.8xlarge", "i2.xlarge", "i2.2xlarge", "i2.4xlarge", "i2.8xlarge", "i3.large", "i3.xlarge", "i3.2xlarge", "i3.4xlarge", "i3.8xlarge", "i3.16xlarge", "i3.metal", "i3en.large", "i3en.xlarge", "i3en.2xlarge", "i3en.3xlarge", "i3en.6xlarge", "i3en.12xlarge", "i3en.24xlarge", "i3en.metal", "i4i.large", "i4i.xlarge", "i4i.2xlarge", "i4i.4xlarge", "i4i.8xlarge", "i4i.16xlarge", "i4i.32xlarge", "i4i.metal", "inf1.xlarge", "inf1.2xlarge", "inf1.6xlarge", "inf1.24xlarge", "inf2.xlarge", "inf2.8xlarge", "inf2.24xlarge", "inf2.48xlarge", "m1.small", "m1.medium", "m1.large", "m1.xlarge", "m2.xlarge", "m2.2xlarge", "m2.4xlarge", "m3.medium", "m3.large", "m3.xlarge", "m3.2xlarge", "m4.large", "m4.xlarge", "m4.2xlarge", "m4.4xlarge", "m4.10xlarge", "m4.16xlarge", "m5.large", "m5.xlarge", "m5.2xlarge", "m5.4xlarge", "m5.8xlarge", "m5.12xlarge", "m5.16xlarge", "m5.24xlarge", "m5.metal", "m5a.large", "m5a.xlarge", "m5a.2xlarge", "m5a.4xlarge", "m5a.8xlarge", "m5a.12xlarge", "m5a.16xlarge", "m5a.24xlarge", "m5ad.large", "m5ad.xlarge", "m5ad.2xlarge", "m5ad.4xlarge", "m5ad.8xlarge", "m5ad.12xlarge", "m5ad.16xlarge", "m5ad.24xlarge", "m5d.large", "m5d.xlarge", "m5d.2xlarge", "m5d.4xlarge", "m5d.8xlarge", "m5d.12xlarge", "m5d.16xlarge", "m5d.24xlarge", "m5d.metal", "m5dn.large", "m5dn.xlarge", "m5dn.2xlarge", "m5dn.4xlarge", "m5dn.8xlarge", "m5dn.12xlarge", "m5dn.16xlarge", "m5dn.24xlarge", "m5dn.metal", "m5n.large", "m5n.xlarge", "m5n.2xlarge", "m5n.4xlarge", "m5n.8xlarge", "m5n.12xlarge", "m5n.16xlarge", "m5n.24xlarge", "m5n.metal", "m5zn.large", "m5zn.xlarge", "m5zn.2xlarge", "m5zn.3xlarge", "m5zn.6xlarge", "m5zn.12xlarge", "m5zn.metal", "m6a.large", "m6a.xlarge", "m6a.2xlarge", "m6a.4xlarge", "m6a.8xlarge", "m6a.12xlarge", "m6a.16xlarge", "m6a.24xlarge", "m6a.32xlarge", "m6a.48xlarge", "m6a.metal", "m6i.large", "m6i.xlarge", "m6i.2xlarge", "m6i.4xlarge", "m6i.8xlarge", "m6i.12xlarge", "m6i.16xlarge", "m6i.24xlarge", "m6i.32xlarge", "m6i.metal", "m6id.large", "m6id.xlarge", "m6id.2xlarge", "m6id.4xlarge", "m6id.8xlarge", "m6id.12xlarge", "m6id.16xlarge", "m6id.24xlarge", "m6id.32xlarge", "m6id.metal", "m6idn.large", "m6idn.xlarge", "m6idn.2xlarge", "m6idn.4xlarge", "m6idn.8xlarge", "m6idn.12xlarge", "m6idn.16xlarge", "m6idn.24xlarge", "m6idn.32xlarge", "m6in.large", "m6in.xlarge", "m6in.2xlarge", "m6in.4xlarge", "m6in.8xlarge", "m6in.12xlarge", "m6in.16xlarge", "m6in.24xlarge", "m6in.32xlarge", "p2.xlarge", "p2.8xlarge", "p2.16xlarge", "p3.2xlarge", "p3.8xlarge", "p3.16xlarge", "p3dn.24xlarge", "p4d.24xlarge", "r3.large", "r3.xlarge", "r3.2xlarge", "r3.4xlarge", "r3.8xlarge", "r4.large", "r4.xlarge", "r4.2xlarge", "r4.4xlarge", "r4.8xlarge", "r4.16xlarge", "r5.large", "r5.xlarge", "r5.2xlarge", "r5.4xlarge", "r5.8xlarge", "r5.12xlarge", "r5.16xlarge", "r5.24xlarge", "r5.metal", "r5a.large", "r5a.xlarge", "r5a.2xlarge", "r5a.4xlarge", "r5a.8xlarge", "r5a.12xlarge", "r5a.16xlarge", "r5a.24xlarge", "r5ad.large", "r5ad.xlarge", "r5ad.2xlarge", "r5ad.4xlarge", "r5ad.8xlarge", "r5ad.12xlarge", "r5ad.16xlarge", "r5ad.24xlarge", "r5b.large", "r5b.xlarge", "r5b.2xlarge", "r5b.4xlarge", "r5b.8xlarge", "r5b.12xlarge", "r5b.16xlarge", "r5b.24xlarge", "r5b.metal", "r5d.large", "r5d.xlarge", "r5d.2xlarge", "r5d.4xlarge", "r5d.8xlarge", "r5d.12xlarge", "r5d.16xlarge", "r5d.24xlarge", "r5d.metal", "r5dn.large", "r5dn.xlarge", "r5dn.2xlarge", "r5dn.4xlarge", "r5dn.8xlarge", "r5dn.12xlarge", "r5dn.16xlarge", "r5dn.24xlarge", "r5dn.metal", "r5n.large", "r5n.xlarge", "r5n.2xlarge", "r5n.4xlarge", "r5n.8xlarge", "r5n.12xlarge", "r5n.16xlarge", "r5n.24xlarge", "r5n.metal", "r6a.large", "r6a.xlarge", "r6a.2xlarge", "r6a.4xlarge", "r6a.8xlarge", "r6a.12xlarge", "r6a.16xlarge", "r6a.24xlarge", "r6a.32xlarge", "r6a.48xlarge", "r6a.metal", "r6i.large", "r6i.xlarge", "r6i.2xlarge", "r6i.4xlarge", "r6i.8xlarge", "r6i.12xlarge", "r6i.16xlarge", "r6i.24xlarge", "r6i.32xlarge", "r6i.metal", "r6id.large", "r6id.xlarge", "r6id.2xlarge", "r6id.4xlarge", "r6id.8xlarge", "r6id.12xlarge", "r6id.16xlarge", "r6id.24xlarge", "r6id.32xlarge", "r6id.metal", "r6idn.large", "r6idn.xlarge", "r6idn.2xlarge", "r6idn.4xlarge", "r6idn.8xlarge", "r6idn.12xlarge", "r6idn.16xlarge", "r6idn.24xlarge", "r6idn.32xlarge", "r6in.large", "r6in.xlarge", "r6in.2xlarge", "r6in.4xlarge", "r6in.8xlarge", "r6in.12xlarge", "r6in.16xlarge", "r6in.24xlarge", "r6in.32xlarge", "t1.micro", "t2.nano", "t2.micro", "t2.small", "t2.medium", "t2.large", "t2.xlarge", "t2.2xlarge", "t3.nano", "t3.micro", "t3.small", "t3.medium", "t3.large", "t3.xlarge", "t3.2xlarge", "t3a.nano", "t3a.micro", "t3a.small", "t3a.medium", "t3a.large", "t3a.xlarge", "t3a.2xlarge", "trn1.2xlarge", "trn1.32xlarge", "trn1n.32xlarge", "u-12tb1.112xlarge", "u-12tb1.metal", "u-18tb1.112xlarge", "u-18tb1.metal", "u-24tb1.112xlarge", "u-24tb1.metal", "u-3tb1.56xlarge", "u-6tb1.56xlarge", "u-6tb1.112xlarge", "u-6tb1.metal", "u-9tb1.112xlarge", "u-9tb1.metal", "vt1.3xlarge", "vt1.6xlarge", "vt1.24xlarge", "x1.16xlarge", "x1.32xlarge", "x1e.xlarge", "x1e.2xlarge", "x1e.4xlarge", "x1e.8xlarge", "x1e.16xlarge", "x1e.32xlarge", "x2idn.16xlarge", "x2idn.24xlarge", "x2idn.32xlarge", "x2idn.metal", "x2iedn.xlarge", "x2iedn.2xlarge", "x2iedn.4xlarge", "x2iedn.8xlarge", "x2iedn.16xlarge", "x2iedn.24xlarge", "x2iedn.32xlarge", "x2iedn.metal", "x2iezn.2xlarge", "x2iezn.4xlarge", "x2iezn.6xlarge", "x2iezn.8xlarge", "x2iezn.12xlarge", "x2iezn.metal", "z1d.large", "z1d.xlarge", "z1d.2xlarge", "z1d.3xlarge", "z1d.6xlarge", "z1d.12xlarge", "z1d.metal"];

const amiMappings: { [key: string]: string } = {
  'us-east-1': 'ami-0dacdfe7a343e689e',
  'eu-west-1': 'ami-0b1429e53597c2a77',
  'us-west-1': 'ami-037e7aa61373dc87a',
  'ap-southeast-1': 'ami-0f5fe2ffc3f03fd58',
  'ap-northeast-1': 'ami-052cb9b2593f12deb',
  'us-west-2': 'ami-004c77ebdfd934303',
  'sa-east-1': 'ami-03359c48de3e9cd23',
  'ap-southeast-2': 'ami-0bd1869b14eb93b20',
  'eu-central-1': 'ami-0da618d36f70f9623',
  'ap-northeast-2': 'ami-048a5d5f24e80875e',
  'ap-south-1': 'ami-053e3f3b82210918d',
  'us-east-2': 'ami-0b4ce81bf42c56542',
  'ca-central-1': 'ami-0a07acd1cbcca880a',
  'eu-west-2': 'ami-088505fb38f3d726a',
  'eu-west-3': 'ami-0ea06906ca5848d2e',
  'ap-northeast-3': 'ami-028a5cae039ba08ad',
  'eu-north-1': 'ami-0ac464bcb2dc5e34f',
  'ap-east-1': 'ami-0adbbdc17a95333e1',
  'me-south-1': 'ami-0dfb4109a6e932fb4',
  'af-south-1': 'ami-07809e2c6c53e7879',
  'eu-south-1': 'ami-0d35b0c046f9ddc59',
  'ap-southeast-3': 'ami-04d5dcd62d716e4e8',
  'us-gov-east-1': 'ami-008fde8b5899068b1',
  'us-gov-west-1': 'ami-056e4c48140686738',
};


class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // VpcId parameter
    const vpcId = new TerraformVariable(this, 'VpcId', {
      type: 'string',
      description: 'VpcId of your existing Virtual Private Cloud (VPC)',
    });

    // SubnetIds parameter
    const subnetIds = new TerraformVariable(this, 'SubnetIds', {
      type: 'list(string)',
      description: 'The list of SubnetIds in your Virtual Private Cloud (VPC)',
    });

    // MSKPort parameter
    const mskPort = new TerraformVariable(this, 'MSKPort', {
      type: 'number',
      default: 9094,
      description: 'The port number for MSK bootstrap servers',
    });

    // MSKWildcardDNS parameter
    const mskWildcardDNS = new TerraformVariable(this, 'MSKWildcardDNS', {
      type: 'string',
      description: 'The wildcard DNS pattern for MSK bootstrap servers'
    });
    mskWildcardDNS.addValidation({
      condition: `Fn.regex("^\\*\\..*", ${mskWildcardDNS.stringValue})`,
      errorMessage: 'Wildcard pattern must match all target MSK broker server names',
    })

    // MSKProxyCapacity parameter
    const mskProxyCapacity = new TerraformVariable(this, 'MSKProxyCapacity', {
      type: 'number',
      default: 2,
      description: 'The initial number of MSK Proxy instances'
    });
    mskProxyCapacity.addValidation({
        condition: `${mskProxyCapacity.numberValue} >= 1 && ${mskProxyCapacity.numberValue} <= 5`,
        errorMessage: 'Must be between 1 and 5 EC2 instances'
    });

    // MSKProxyRole parameter
    const mskProxyRole = new TerraformVariable(this, 'MSKProxyRole', {
      type: 'string',
      description: 'The role name assumed by MSK Proxy instances.',
    });

    // MSKProxySecurityGroups parameter
    const mskProxySecurityGroups = new TerraformVariable(this, 'MSKProxySecurityGroups', {
      type: 'list(string)',
      description: 'The security groups associated with MSK Proxy instances.',
    });

    // PublicPort parameter
    const publicPort = new TerraformVariable(this, 'PublicPort', {
      type: 'number',
      default: 9094,
      description: 'The public port number to be used by Kafka clients',
    });

    // PublicWildcardDNS parameter
    const publicWildcardDNS = new TerraformVariable(this, 'PublicWildcardDNS', {
      type: 'string',
      description: 'The public wildcard DNS pattern for bootstrap servers to be used by Kafka clients'
    });
    publicWildcardDNS.addValidation({
      condition: `Fn.regex("^\\*\\..*", ${publicWildcardDNS.stringValue})`,
      errorMessage: 'Public wildcard pattern must match TLS certificate wildcard SAN'
    })

    // PublicTlsCertificateKey parameter
    const publicTlsCertificateKey = new TerraformVariable(this, 'PublicTlsCertificateKey', {
      type: 'string',
      description: 'TLS Certificate Private Key Secret ARN'
    });
    publicTlsCertificateKey.addValidation({
      condition: `${Fn.regex("^arn:aws:secretsmanager:.*", publicTlsCertificateKey.stringValue)}`,
      errorMessage: 'Must follow SecretsManager ARN syntax'
    })

    // KeyName parameter
    const keyName = new TerraformVariable(this, 'KeyName', {
      type: 'string',
      description: 'Name of an existing EC2 KeyPair to enable SSH access to the instances',
    });

    // InstanceType parameter
    const instanceType = new TerraformVariable(this, 'InstanceType', {
      type: 'string',
      default: 't3.small',
      description: 'MSK Proxy EC2 instance type'
    });
    instanceType.addValidation({
      condition: `${Fn.contains(instanceTypes, instanceType.stringValue)}`,
      errorMessage: 'must be a valid EC2 instance type.'
    })

    // Fetch subnets in the VPC
    const subnetsData = new aws.dataAwsSubnets.DataAwsSubnets(this, 'subnetsData', {
      filter: [{
        name: 'vpc-id',
        values: [vpcId.value],
      }],
    });

    // Fetch security groups in the VPC
    const securityGroupsData = new aws.dataAwsSecurityGroups.DataAwsSecurityGroups(this, 'securityGroupsData', {
      filter: [{
        name: 'vpc-id',
        values: [vpcId.value],
      }],
    });

    // Validation for Subnets in VPC
    new TerraformOutput(this, 'SubnetsInVpcValidation', {
      value: subnetIds.listValue.every((subnetId: string) =>
        subnetsData.ids.includes(subnetId)
      ) ? 'All subnets are in the VPC' : 'Some subnets are not in the VPC',
    });

    // Validation for Security Groups in VPC
    new TerraformOutput(this, 'SecurityGroupsInVpcValidation', {
      value: mskProxySecurityGroups.listValue.every((sgId: string) =>
        securityGroupsData.ids.includes(sgId)
      ) ? 'All security groups are in the VPC' : 'Some security groups are not in the VPC',
    });

    // I guess we need to get it from user here?
    const region = new TerraformVariable(this, 'AWSRegion', {
      type: 'string',
      description: 'The AWS region',
      default: 'us-east-1',
    });

    const imageId = amiMappings[region.value];

    // Network Load Balancer
    const nlb = new Lb(this, 'NetworkLoadBalancer', {
      name: 'network-load-balancer',
      loadBalancerType: 'network',
      internal: false,
      subnets: subnetIds.value,
      enableCrossZoneLoadBalancing: true,
    });

    // NLB Target Group
    const nlbTargetGroup = new LbTargetGroup(this, 'NLBTargetGroup', {
      name: 'nlb-target-group',
      port: publicPort.value,
      protocol: 'TCP',
      vpcId: vpcId.value,
    });

    // NLB Listener
    new LbListener(this, 'NLBListener', {
      loadBalancerArn: nlb.arn,
      port: publicPort.value,
      protocol: 'TCP',
      defaultAction: [{
        type: 'forward',
        targetGroupArn: nlbTargetGroup.arn,
      }],
    });

    // Define the LaunchTemplate
    const MSKProxyLaunchTemplate = new launchTemplate.LaunchTemplate(this, 'MSKProxyLaunchTemplate', {
      namePrefix: 'MSKProxyLaunchTemplate',
      imageId: imageId,
      instanceType: instanceType.stringValue,
      networkInterfaces: [
        {
          associatePublicIpAddress: 'true',
          deviceIndex: 0,
          securityGroups: mskProxySecurityGroups.listValue
        },
      ],
      iamInstanceProfile: {
        name: mskProxyRole.stringValue
      },
      keyName: keyName.stringValue,
      userData: `
        #!/bin/bash -xe
        yum update -y aws-cfn-bootstrap
        /opt/aws/bin/cfn-init -v --stack ${id} --resource MSKProxyLaunchTemplate --region ${region.stringValue}
        /opt/aws/bin/cfn-signal -e $? --stack ${id} --resource MSKProxyGroup --region ${region.stringValue}
      `
    });

    // Add metadata via aws_launch_template resource
    MSKProxyLaunchTemplate.addOverride('metadata.AWS::CloudFormation::Init', {
      config: {
        files: {
          '/etc/zilla/zilla.yaml': {
            content: `
              name: public
              vaults:
                secure:
                  type: aws
              bindings:
                tcp_server:
                  type: tcp
                  kind: server
                  options:
                    host: 0.0.0.0
                    port: \${{ var.EXTERNAL_PORT }}
                  exit: tls_server
                tls_server:
                  type: tls
                  kind: server
                  vault: secure
                  options:
                    keys:
                      - \${{ var.EXTERNAL_KEY }}
                  routes:
                    - exit: kafka_proxy
                      when:
                        - authority: "\${{ var.EXTERNAL_AUTHORITY }}"
                kafka_proxy:
                  type: kafka-proxy
                  kind: proxy
                  options:
                    external:
                      host: "\${{ var.EXTERNAL_HOST }}"
                      port: \${{ var.EXTERNAL_PORT }}
                    internal:
                      host: "\${{ var.INTERNAL_HOST }}"
                      port: \${{ var.INTERNAL_PORT }}
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
                    host: "*"
                    port: \${{ var.INTERNAL_PORT }}
                  routes:
                    - when:
                        - authority: "\${{ var.INTERNAL_AUTHORITY }}"
            `,
            context: {
              INTERNAL_HOST: '${join("", ["b-#.", select("1", split("*.", var.MSKWildcardDNS))])}',
              INTERNAL_PORT: mskPort.numberValue,
              INTERNAL_AUTHORITY: mskWildcardDNS.stringValue,
              EXTERNAL_HOST: '${join("", ["b-#.", select("1", split("*.", var.PublicWildcardDNS))])}',
              EXTERNAL_PORT: publicPort.numberValue,
              EXTERNAL_AUTHORITY: publicWildcardDNS.stringValue,
              EXTERNAL_KEY: publicTlsCertificateKey.stringValue,
            },
            owner: 'ec2-user',
            group: 'ec2-user',
          },
          '/etc/cfn/cfn-hup.conf': {
            content: `
              [main]
              stack=\${{ var.AWS_STACK_ID }}
              region=\${{ var.AWS_REGION }}
            `,
            context: {
              AWS_STACK_ID: '${this.stackId}',
              AWS_REGION: '${currentRegion.name}',
            },
            mode: '000400',
            owner: 'root',
            group: 'root',
          },
          '/etc/cfn/hooks.d/cfn-auto-reloader.conf': {
            content: `
              [cfn-auto-reloader-hook]
              triggers=post.update
              path=Resources.MSKProxyLaunchTemplate.Metadata.AWS::CloudFormation::Init
              action=/opt/aws/bin/cfnm-init -v --stack \${{ var.AWS_STACK }} --resource MSKProxyLaunchTemplate --region \${{ var.AWS_REGION }}
              runas=root
            `,
            context: {
              AWS_STACK: '${this.stackName}',
              AWS_REGION: '${currentRegion.name}',
            },
            mode: '000400',
            owner: 'root',
            group: 'root',
          },
        },
        services: {
          sysvinit: {
            'cfn-hup': {
              enabled: 'true',
              ensureRunning: 'true',
              files: [
                '/etc/cfn/cfn-hup.conf',
                '/etc/cfn/hooks.d/cfn-auto-reloader.conf',
              ],
            },
            'amazon-ssm-agent': {
              enabled: 'true',
              ensureRunning: 'true',
            },
            'zilla-plus': {
              enabled: 'true',
              ensureRunning: 'true',
              files: [
                '/etc/zilla/zilla.yaml',
              ],
            },
          },
        },
      },
    });
        
    // Define Auto Scaling Group
    const mskProxyGroup = new autoscalingGroup.AutoscalingGroup(this, 'MSKProxyGroup', {
      vpcZoneIdentifier: subnetIds.listValue,
      launchTemplate: MSKProxyLaunchTemplate,
      minSize: 1,
      maxSize: 5,
      desiredCapacity: mskProxyCapacity.numberValue,
      targetGroupArns: [nlbTargetGroup.arn],
    });

    // Create Creation Policy
    mskProxyGroup.addOverride('creationPolicy', {
      resourceSignal: {
        timeout: 'PT5M',
        count: mskProxyCapacity.numberValue
      },
    });

    // Create Update Policy
    mskProxyGroup.addOverride('updatePolicy', {
      autoScalingRollingUpdate: {
        minInstancesInService: 1,
        maxBatchSize: 1,
        pauseTime: 'PT15M',
        waitOnResourceSignals: true,
      },
    });

    // CDKTF Outputs
    new TerraformOutput(this, 'NetworkLoadBalancerOutput', {
      description: 'Public DNS name of newly created NLB for Public MSK Proxy',
      value: nlb.dnsName,
    });

    new AwsProvider(this, "AWS", {
      region: "us-east-1",
      accessKey: "ASIAWPRT43PNB7WZO6H5",
      secretKey: "6PlbGQTjg2uuPv6hArEunBsg1AFJP4non7DrWoV7"
    });
  }
}

const app = new App();
const stack = new MyStack(app, "secure-public-access-unauthorized-sasl");
new CloudBackend(stack, {
  hostname: "app.terraform.io",
  organization: "Aklivity",
  workspaces: new NamedCloudWorkspace("secure-public-access-unauthorized-sasl")
});
app.synth();
