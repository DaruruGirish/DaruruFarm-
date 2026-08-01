// cloudwatch.tf
// CloudWatch Log Group, Alarms, and Dashboard for EC2 monitoring

resource "aws_cloudwatch_log_group" "ec2_logs" {
  name              = "${var.project_name}-logs"
  retention_in_days = 7
}

// CPU Utilization Alarm (>80%)
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU utilization exceeds 80%"
  dimensions = {
    InstanceId = aws_instance.app.id
  }
  treat_missing_data = "notBreaching"
}

// Status Check Failed Alarm (any failure)
resource "aws_cloudwatch_metric_alarm" "status_check_failed" {
  alarm_name          = "${var.project_name}-status-check-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "EC2 status check failed"
  dimensions = {
    InstanceId = aws_instance.app.id
  }
  treat_missing_data = "notBreaching"
}

// CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "dashboard" {
  dashboard_name = "${var.project_name}-dashboard"
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric",
        x    = 0, y = 0, width = 12, height = 6,
        properties = {
          metrics = [["AWS/EC2", "CPUUtilization", "InstanceId", aws_instance.app.id]],
          period  = 300,
          region  = "ap-south-2",
          title   = "CPU Utilization",
          stat    = "Average"
        }
      },
      {
        type = "metric",
        x    = 0, y = 6, width = 12, height = 6,
        properties = {
          metrics = [["CWAgent", "mem_used_percent", "InstanceId", aws_instance.app.id]],
          period  = 300,
          region  = "ap-south-2",
          title   = "Memory Utilization",
          stat    = "Average"
        }
      },
      {
        type = "metric",
        x    = 12, y = 0, width = 12, height = 6,
        properties = {
          metrics = [["CWAgent", "disk_used_percent", "InstanceId", aws_instance.app.id]],
          period  = 300,
          region  = "ap-south-2",
          title   = "Disk Utilization",
          stat    = "Average"
        }
      },
      {
        type = "metric",
        x    = 12, y = 6, width = 12, height = 6,
        properties = {
          metrics = [["CWAgent", "net_bytes_sent", "InstanceId", aws_instance.app.id], ["CWAgent", "net_bytes_recv", "InstanceId", aws_instance.app.id]],
          period  = 300,
          region  = "ap-south-2",
          title   = "Network Traffic",
          stat    = "Sum"
        }
      }
    ]
  })
}
