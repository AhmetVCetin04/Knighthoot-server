Alright, heres whats up
we want to test all the api calls, and thats easy enough
but we wanna check if they actually work functionally and thats a little harder

heres how we are gonna do it
register a teacher
register a student
check that emails exist
email verification for everything
login as teacher
login as student
change passwords for both
insure passwords have been changed for both
teacher creates test
read tests as teacher
update test
join test as student
start test

for x number of questions:
	submit question 
	next question

student submit test
end test and reset question counter
duplicate test
search student scores by test
read tests as student
delete tests
get student scores
delete teacher
delete student

actual api calls
-------------------
register.js # for students with non existent email
        takes - firstName, lastName, username, password, email, isTeacher(bool)
        db input - _id, ID, firstName, LastName, username, password, email 
        api return - ID, firstName, lastName, username, password, email, message
register.js #for teacher with non existent email

check db, make sure entries DONT exist

register.js # for students with real email
register.js #for teacher with real email

do we have to accept email verification, how can we automate this

check db, make sure entries DO exist

login as teacher
login as student

logout as teacher
logout as student

change teacher password
try login as teacher with old password

change student password
try login as student with old password

login to teacher with new password
login to student with new password

teacher creates test
read test
update test
start test
join test as student

for x questions in test test
	student submit question
	teacher next question

student submit test
teacher ends test
teacher duplicates test
teacher reads test scores
student reads test score
teacher delete test

delete student
delete teacher
------------
whats done vs whats left
register
login
delete

