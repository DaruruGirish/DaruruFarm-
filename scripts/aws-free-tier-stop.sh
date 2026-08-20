#!/usr/bin/env bash
# Stop billable free-tier resources when not testing.
set -euo pipefail
PROJECT_NAME="${PROJECT_NAME:-darurufarm}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-}}"
if [[ -z "$REGION" ]]; then
  echo "Set AWS_REGION" >&2
  exit 1
fi

INSTANCE_ID=$(aws ec2 describe-instances \
  --region "$REGION" \
  --filters "Name=tag:Name,Values=${PROJECT_NAME}-prod-ec2" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].InstanceId" --output text)
if [[ -n "$INSTANCE_ID" && "$INSTANCE_ID" != "None" ]]; then
  echo "Stopping EC2 $INSTANCE_ID"
  aws ec2 stop-instances --region "$REGION" --instance-ids "$INSTANCE_ID"
fi

DB_ID=$(aws rds describe-db-instances --region "$REGION" \
  --query "DBInstances[?contains(DBInstanceIdentifier, '${PROJECT_NAME}')].DBInstanceIdentifier | [0]" --output text)
STATUS=$(aws rds describe-db-instances --region "$REGION" --db-instance-identifier "$DB_ID" --query "DBInstances[0].DBInstanceStatus" --output text)
if [[ "$STATUS" == "available" ]]; then
  echo "Stopping RDS $DB_ID"
  aws rds stop-db-instance --region "$REGION" --db-instance-identifier "$DB_ID"
fi

echo "Stopped. ALB/EIP should remain disabled in terraform.tfvars for free-tier."
