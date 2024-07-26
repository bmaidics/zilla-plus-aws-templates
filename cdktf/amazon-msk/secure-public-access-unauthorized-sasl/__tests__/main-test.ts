import "cdktf/lib/testing/adapters/jest";
import { Testing } from "cdktf";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { autoscalingGroup, launchTemplate } from "@cdktf/provider-aws";
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { ZillaPlusSecurePublicAccessUnauthorizedSaslStack } from "../main";

describe("Zilla Plus Secure Public Access Unauthorized/SASL Stack Test", () => {
  let output: string;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new ZillaPlusSecurePublicAccessUnauthorizedSaslStack(app, "test");
    output = Testing.synth(stack);
  });

  it("should have auto scaling group", async () => {
    expect(output).toHaveResourceWithProperties(
      autoscalingGroup.AutoscalingGroup,
      {
        min_size: 1,
        max_size: 5,
        launch_template: expect.objectContaining({
          id: expect.stringContaining("${aws_launch_template.ZillaPlusLaunchTemplate.id}")
        }),
        target_group_arns: expect.arrayContaining(
          ["${aws_lb_target_group.NLBTargetGroup.arn}"]
        ),
        vpc_zone_identifier: "${var.subnet_ids}" 
      });
  });

  it("should have cloudwatch group resource", async () => {
    process.env.CLOUDWATCH_ENABLED="true";
    const app = Testing.app();
    const stack = new ZillaPlusSecurePublicAccessUnauthorizedSaslStack(app, "test");
    const output = Testing.synth(stack);

    expect(output).toHaveResourceWithProperties(CloudwatchLogGroup, {
      name: "${var.cloudwatch_logs_group}"
    })
    delete process.env.CLOUDWATCH_ENABLED;
  });

  it("should have load balancer target group", async () => {
    expect(output).toHaveResourceWithProperties(
      LbTargetGroup, {
        vpc_id: "${var.vpc_id}",
        name: "nlb-target-group",
        port: "${var.public_port}",
        protocol: "TCP"
      });
  });

  it("should have load balancer", async () => {
    expect(output).toHaveResourceWithProperties(
      Lb, {
        enable_cross_zone_load_balancing: true,
        internal: false,
        load_balancer_type: "network",
        name: "network-load-balancer",
        subnets: "${var.subnet_ids}"
      });
  });

  it("should have load balancer listener", async () => {
    expect(output).toHaveResourceWithProperties(
      LbListener, {
        default_action: [
          {
            "target_group_arn": "${aws_lb_target_group.NLBTargetGroup.arn}",
            "type": "forward"
          }
        ],
        load_balancer_arn: "${aws_lb.NetworkLoadBalancer.arn}",
        port: "${var.public_port}",
        protocol: "TCP"
      });
  });


  it("should have launch template", async () => {

    expect(output).toHaveResourceWithProperties(
      launchTemplate.LaunchTemplate, {
        iam_instance_profile: {
          name: "${var.zilla_plus_role}"
        },
        image_id: "${data.aws_ami.LatestAmi.image_id}",
        instance_type: "${var.instance_type}",
        network_interfaces: [
          {
            associate_public_ip_address: "true",
            device_index: 0,
            security_groups: "${var.zilla_plus_security_groups}"
          }
        ],
      });
  });
});
