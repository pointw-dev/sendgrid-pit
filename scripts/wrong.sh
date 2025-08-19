#!/bin/bash

curl -X POST "http://localhost:$1/v3/mail/send"   -H "content-type: application/json"   -d '{"to":"michael@example.com","from":"noreply@example.com","subject":"Hello","text":"Message for you, sir!"}'
echo ''
