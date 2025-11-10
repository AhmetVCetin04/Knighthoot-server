#!/bin/bash

> newman.log

ENV_FILE="test_environment.json"

echo "registering student"
newman run RegisterStudent.postman_collection.json --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "attempting to register pre-existing student"
newman run RegisterStudent.postman_collection.json --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "registering teacher"
newman run RegisterTeacher.postman_collection.json --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "attempting to register pre-existing teacher"
newman run RegisterTeacher.postman_collection.json --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "loging in student"
newman run LoginStudent.postman_collection.json --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "loging in teacher"
newman run LoginTeacher.postman_collection.json --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "deleting student"
newman run DeleteStudent.postman_collection.json --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "deleting teacher"
newman run DeleteTeacher.postman_collection.json --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

