#!/bin/bash

> newman.log

ENV_FILE="test_environment.json"

echo "registering student"
newman run RegisterStudent.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "attempting to register pre-existing student"
newman run RegisterStudent.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "registering teacher"
newman run RegisterTeacher.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "attempting to register pre-existing teacher"
newman run RegisterTeacher.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "loging in student"
newman run LoginStudent.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "loging in teacher"
newman run LoginTeacher.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "student forgets password"
newman run StudentForgotPassword.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "teacher forgets password"
newman run TeacherForgotPassword.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "Fetching OTPs from MongoDB..."

# --- Fetch Student OTP ---
STUDENT_OTP=$(mongosh --quiet --eval '
  const dbRef = db.getSiblingDB("Knighthoot");
  const user = dbRef.Students.findOne({ email: "jonsnow@example.com" });
  if (user && user.resetOtp) print(user.resetOtp);
  else print("NO_OTP");
  quit();
')

# --- Fetch Teacher OTP ---
TEACHER_OTP=$(mongosh --quiet --eval '
  const dbRef = db.getSiblingDB("Knighthoot");
  const user = dbRef.Teachers.findOne({ email: "gandalf@example.com" });
  if (user && user.resetOtp) print(user.resetOtp);
  else print("NO_OTP");
  quit();
')

# --- Bash error handling and validation ---
if [[ -z "$STUDENT_OTP" || "$STUDENT_OTP" == "NO_OTP" ]]; then
  echo " No OTP found for Student (jonsnow@example.com)"
  echo "    → Check if StudentForgotPassword API ran successfully."
  exit 1
else
  echo " Student OTP: $STUDENT_OTP"
fi

if [[ -z "$TEACHER_OTP" || "$TEACHER_OTP" == "NO_OTP" ]]; then
  echo " No OTP found for Teacher (gandalf@example.com)"
  echo "    → Check if TeacherForgotPassword API ran successfully."
  exit 1
else
  echo " Teacher OTP: $TEACHER_OTP"
fi


echo "Student otp is $STUDENT_OTP"

echo "Teacher otp is $TEACHER_OTP"

echo "Student resets password"
newman run StudentResetPassword.postman_collection.json --insecure --environment "$ENV_FILE" --env-var "otp=$STUDENT_OTP" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "Teacher resets password"
newman run TeacherResetPassword.postman_collection.json --insecure --environment "$ENV_FILE" --env-var "otp=$TEACHER_OTP" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "loging in student with new password"
newman run NewLoginStudent.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "loging in teacher with new password"
newman run NewLoginTeacher.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "teacher creates test"
newman run TeacherCreatesTest.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "teacher starts test"
newman run TeacherStartsTest.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "student joins test"
newman run StudentJoinsTest.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "deleting student"
newman run DeleteStudent.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1

echo "deleting teacher"
newman run DeleteTeacher.postman_collection.json --insecure --environment "$ENV_FILE" --export-environment "$ENV_FILE" >> newman.log 2>&1 || exit 1
