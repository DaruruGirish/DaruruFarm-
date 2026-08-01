// ec2.tf
// EC2 instance with Amazon Linux 2023 AMI, user data installing Docker, Docker Compose, Git, AWS CLI, and CloudWatch Agent

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.amazon_linux_2023.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.instance_sg.id]
  key_name                    = var.key_pair_name
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
    #!/bin/bash
    set -e
    # Update system
    yum update -y
    # Install Docker
    amazon-linux-extras install -y docker
    systemctl enable docker
    systemctl start docker
    # Install Docker Compose plugin (v2)
    mkdir -p /usr/lib/docker/cli-plugins
    curl -SL https://github.com/docker/compose/releases/download/v2.27.1/docker-compose-linux-x86_64 -o /usr/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/lib/docker/cli-plugins/docker-compose
    # Install Git
    yum install -y git
    # Install AWS CLI v2
    curl https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o awscliv2.zip
    unzip awscliv2.zip
    ./aws/install
    # Install CloudWatch Agent
    yum install -y amazon-cloudwatch-agent
    cat <<'CWCONFIG' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
    {
      "metrics": {
        "append_dimensions": {"InstanceId": "$${aws:InstanceId}"},
        "metrics_collected": {
          "cpu": {"measurement": ["cpu_usage_idle"], "metrics_collection_interval": 60, "totalcpu": true},
          "mem": {"measurement": ["mem_used_percent"], "metrics_collection_interval": 60},
          "disk": {"measurement": ["disk_used_percent"], "metrics_collection_interval": 60, "resources": ["*"]},
          "net": {"measurement": ["bytes_sent", "bytes_recv"], "metrics_collection_interval": 60}
        }
      },
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {"file_path": "/var/log/messages", "log_group_name": "${var.project_name}-logs", "log_stream_name": "system"},
              {"file_path": "/var/log/docker", "log_group_name": "${var.project_name}-logs", "log_stream_name": "docker"},
              {"file_path": "/var/log/nginx/access.log", "log_group_name": "${var.project_name}-logs", "log_stream_name": "nginx-access"},
              {"file_path": "/var/log/nginx/error.log", "log_group_name": "${var.project_name}-logs", "log_stream_name": "nginx-error"},
              {"file_path": "/var/log/app/backend.log", "log_group_name": "${var.project_name}-logs", "log_stream_name": "backend"}
            ]
          }
        }
      }
    }
    CWCONFIG
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF

  tags = {
    Project     = "DaruruFarm"
    Environment = "Dev"
    ManagedBy   = "Terraform"
    Name        = "${var.project_name}-ec2"
  }
}
