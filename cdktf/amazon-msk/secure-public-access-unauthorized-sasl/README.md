# CDKTF Project Setup Guide

This guide will help you gather the necessary AWS values required to configure and deploy Zilla Plus Secure Public Access using CDKTF.

## Prerequisites

1. Install AWS CLI: Follow the official [AWS CLI installation guide](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html).
2. Configure AWS CLI: Run `aws configure` and follow the prompts to set up your AWS credentials.
3. Set your aws region: `aws configure set region us-east-1` 
4. Verify your region and credentials: `aws configure list`

## Variables

### 1. VPC ID (vpc_id)

You need the ID of the Virtual Private Cloud (VPC) where you want to deploy your resources.

List all VPCs:
```bash
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId, Tags[?Key==`Name`].Value | [0]]' --output table
```

Note down the VPC ID (VpcId) of the desired VPC.
### 2. Subnet IDs (subnet_ids)
You need the IDs of the subnets within the selected VPC.

List all subnets in the selected VPC:

```bash
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<YourVpcId>" --query 'Subnets[*].[SubnetId, Tags[?Key==`Name`].Value | [0]]' --output table
```

Replace <YourVpcId> with the VPC ID you obtained earlier.

Note down the Subnet IDs (SubnetId) of the desired subnets.

### 3. MSK Access Method (msk_access_method)
You need the provide the access method for Zilla Plus to use when connecting to your MSK cluster. Allowed values: SASL/SCRAM or Unauthenticated.

### 4. MSK Cluster Name (msk_cluster_name)
You need the name of your MSK cluster.

List all MSK clusters:
```bash
aws kafka list-clusters --query 'ClusterInfoList[*].[ClusterName,ClusterArn]' --output table
```
Note down the name (ClusterName) of the desired MSK cluster.

### 5. Zilla Plus Role (zilla_plus_role)
You need the name of the IAM role assumed by Zilla Plus instances.

List all IAM roles:
```bash
aws iam list-roles --query 'Roles[*].[RoleName,Arn]' --output table
```
Note down the role name (RoleName) of the desired IAM role.

### 6. Zilla Plus Security Groups (zilla_plus_security_groups)
You need the IDs of the security groups associated with Zilla Plus instances.

List all security groups:
```bash
aws ec2 describe-security-groups --query 'SecurityGroups[*].[GroupId, GroupName]' --output table
```
Note down the security group IDs (GroupId) of the desired security groups.

### 7. Public TLS Certificate Key (public_tls_certificate_key)
You need the ARN of the Secrets Manager secret that contains your public TLS certificate private key.

List all secrets in Secrets Manager:
```bash
aws secretsmanager list-secrets --query 'SecretList[*].[Name,ARN]' --output table
```
Find and note down the ARN of the secret that contains your public TLS certificate private key.

### 8. Public Wildcard DNS (public_wildcard_dns)

This variable defines the public wildcard DNS pattern for bootstrap servers to be used by Kafka clients.


### 9. Zilla Plus Capacity (zilla_plus_capacity)

This variable defines the initial number of Zilla Plus instances.

#### Default Value

- Default: `2`

### 9. Public TCP Port (public_port)
This variable defines the public port number to be used by Kafka clients.

Default Value
- Default: `9094`



## Optional Features

### CUSTOM_PATH
To enable a custom path for the Kafka topic, set the environment variable CUSTOM_PATH to true. If enabled, you will need to provide the path where the Kafka topic should be exposed.

#### Steps to Configure
1. Set CUSTOM_PATH=true to enable custom path support.
2. Provide the path for the Kafka topic.

### SSH Key Access (key_name)

To enable SSH access to the instances, set the environment variable `SSH_KEY_ENABLED` to `true`. You will also need the name of an existing EC2 KeyPair.

1. List all EC2 KeyPairs:
```bash
aws ec2 describe-key-pairs --query 'KeyPairs[*].[KeyName]' --output table
```
Note down the KeyPair name (KeyName) you want to use.

### CloudWatch Integration
To enable CloudWatch logging and metrics, set the environment variable `CLOUDWATCH_ENABLED` to `true`.

You can create or use existing log groups and metric namespaces in CloudWatch.

#### List All CloudWatch Log Groups (cloudwatch_logs_group)

```bash
aws logs describe-log-groups --query 'logGroups[*].[logGroupName]' --output table
```
This command will return a table listing the names of all the log groups in your CloudWatch.

#### List All CloudWatch Custom Metric Namespaces (cloudwatch_metrics_namespace)

```bash
aws cloudwatch list-metrics --query 'Metrics[*].Namespace' --output text | tr '\t' '\n' | sort | uniq | grep -v '^AWS'
```

## Deploy stack using Terraform

### 1. Synthesize the Terraform Configuration
First, you need to synthesize the Terraform configuration from the CDKTF code.

Navigate to the CDKTF project directory.

Run the following command to synthesize the configuration:

```bash
cdktf synth
```
This command will generate the necessary Terraform JSON configuration files in the cdktf.out directory.

### 2. Navigate to the Terraform Configuration Folder
After synthesizing the configuration, navigate to the folder where the Terraform JSON output is located:

```bash
cd cdktf.out/stacks/secure-public-access-unauthorized-sasl
```

### 3. Run terraform plan

```bash
terraform plan
```
This command will show the execution plan, and you will be prompted to provide necessary input variables. You can manually enter these values when prompted, or use a .tfvars file to provide them.

If you prefer to use a .tfvars file for input variables, create a file named terraform.tfvars and add your variables similar to the provided example `terraform.tfvars.example`.


### 4. Apply the Terraform Plan
Once you have reviewed the plan and provided the necessary inputs, apply the plan to deploy the resources:

```bash
terraform apply
```
