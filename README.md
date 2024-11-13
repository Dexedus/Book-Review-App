# Welcome to Bookstored
This is my book review app where users can read, post update and delete book reviews. I used Openlibrary's APIs to fetch book covers automatically based on the title of the book the user inputs. This application uses PostgreSQL so posts will persist between sessions. I used express.js to write the server side code and used axios to handle API requests.

## Log in/Sign up
This app will ask you to log in or sign up by creating an account with a username (your email address) and a password. These passwords are now hashed and salted for additional security.

## TODO list
- Add feature so only users can update and delete their own posts (Right now anyone can delete any post)
- Add more animations.
- Improve overall responsiveness.
- Fix issue with date's displaying wrong on ocassion.
- Add cookies to create user sessions.

### Feedback
feeback and any suggestions on improving the app are welcome.