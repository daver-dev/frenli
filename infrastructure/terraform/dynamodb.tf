resource "aws_dynamodb_table" "main" {
  name = "frenli-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "partitionKey"
  range_key = "sortKey"

  # Main table key, present on every item.
  attribute {
    name = "partitionKey"
    type = "S"
  }

  attribute {
    name = "sortKey"
    type = "S"
  }

  # Posts by user, newest first (P2). Only Post items set these.
  attribute {
    name = "GSI1PK"
    type = "S"
  }

  # Holds createdAt, so the index sorts posts newest/oldest first.
  attribute {
    name = "GSI1SK"
    type = "S"
  }

  # Comments on a post, oldest first (C1). Only Comment items set these.
  attribute {
    name = "GSI2PK"
    type = "S"
  }

  # Holds createdAt, so the index sorts comments oldest/newest first.
  attribute {
    name = "GSI2SK"
    type = "S"
  }

  # Replies on a comment, oldest first (R1). Only Reply items set these.
  attribute {
    name = "GSI3PK"
    type = "S"
  }

  # Holds createdAt, so the index sorts replies oldest/newest first.
  attribute {
    name = "GSI3SK"
    type = "S"
  }

  # User by username (U2). Only User items set this. No sort key: usernames are unique.
  attribute {
    name = "GSI4PK"
    type = "S"
  }

  # Followers of a user (F4). Only Follow items set these.
  attribute {
    name = "GSI5PK"
    type = "S"
  }

  # Holds createdAt, so the index sorts followers oldest/newest first.
  attribute {
    name = "GSI5SK"
    type = "S"
  }

  # Posts by user, newest first (P2)
  global_secondary_index {
    name = "GSI1"
    key_schema {
      attribute_name = "GSI1PK"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "GSI1SK"
      key_type       = "RANGE"
    }
    projection_type = "ALL"
  }

  # Comments on a post, oldest first (C1)
  global_secondary_index {
    name = "GSI2"
    key_schema {
      attribute_name = "GSI2PK"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "GSI2SK"
      key_type       = "RANGE"
    }
    projection_type = "ALL"
  }

  # Replies on a comment, oldest first (R1)
  global_secondary_index {
    name = "GSI3"
    key_schema {
      attribute_name = "GSI3PK"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "GSI3SK"
      key_type       = "RANGE"
    }
    projection_type = "ALL"
  }

  # User by username (U2)
  global_secondary_index {
    name = "GSI4"
    key_schema {
      attribute_name = "GSI4PK"
      key_type       = "HASH"
    }
    projection_type = "ALL"
  }

  # Followers of a user (F4)
  global_secondary_index {
    name = "GSI5"
    key_schema {
      attribute_name = "GSI5PK"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "GSI5SK"
      key_type       = "RANGE"
    }
    projection_type = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = "frenli"
  }
}

