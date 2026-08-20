resource "aws_route53_zone" "this" {
  count = local.enable_custom_domain && var.create_route53_zone ? 1 : 0
  name  = var.domain_name

  tags = {
    Name = "${local.name_prefix}-zone"
  }
}

resource "aws_route53_record" "app" {
  count = local.enable_custom_domain ? 1 : 0

  zone_id = local.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.app.dns_name
    zone_id                = aws_lb.app.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "www" {
  count = local.enable_custom_domain ? 1 : 0

  zone_id = local.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.app.dns_name
    zone_id                = aws_lb.app.zone_id
    evaluate_target_health = true
  }
}
