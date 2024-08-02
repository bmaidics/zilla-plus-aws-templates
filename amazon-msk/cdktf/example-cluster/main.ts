import { Construct } from "constructs";
import { App, TerraformOutput, TerraformStack } from "cdktf";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { MskCluster } from "@cdktf/provider-aws/lib/msk-cluster";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { DataAwsRegion } from "@cdktf/provider-aws/lib/data-aws-region";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const awsProvider = new AwsProvider(this, "AWS", {
    });

    const vpc = new Vpc(this, 'MskVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'msk-vpc'
      }
    });

    const region = new DataAwsRegion(this, 'CurrentRegion', {
      provider: awsProvider
    });

    new TerraformOutput(this, 'region', {
      value: `${region.name}a`,
    });

    const privateSubnet1 = new Subnet(this, 'PrivateSubnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.128.0/20',
      availabilityZone: `${region.name}a`,
      mapPublicIpOnLaunch: false,
      tags: {
        Name: 'msk-private-subnet-1'
      }
    });

    const privateSubnet2 = new Subnet(this, 'PrivateSubnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.144.0/20',
      availabilityZone: `${region.name}b`,
      mapPublicIpOnLaunch: false,
      tags: {
        Name: 'msk-private-subnet-2'
      }
    });

    const securityGroup = new SecurityGroup(this, 'MskSecurityGroup', {
      vpcId: vpc.id,
      description: 'Security group for MSK cluster',
      ingress: [
        {
          fromPort: 9092,
          toPort: 9096,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0']
        }
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 65535,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0']
        }
      ],
      tags: {
        Name: 'msk-security-group'
      }
    });

    const mskCluster = new MskCluster(this, 'MskCluster', {
      clusterName: 'my-msk-cluster',
      kafkaVersion: '3.5.1',
      numberOfBrokerNodes: 2,
      brokerNodeGroupInfo: {
        instanceType: 'kafka.t3.small',
        clientSubnets: [privateSubnet1.id, privateSubnet2.id],
        securityGroups: [securityGroup.id],
      },
      encryptionInfo: {
        encryptionInTransit: {
          clientBroker: 'TLS_PLAINTEXT',
          inCluster: true
        }
      },
      clientAuthentication: {
        unauthenticated: true
      }
    });

    new TerraformOutput(this, 'vpcId', {
      value: vpc.id,
    });

    new TerraformOutput(this, 'privateSubnetIds', {
      value: [privateSubnet1.id, privateSubnet2.id],
    });

    new TerraformOutput(this, 'mskClusterName', {
      value: mskCluster.clusterName,
    });
  }
}

const app = new App();
new MyStack(app, "example-cluster");
app.synth();
