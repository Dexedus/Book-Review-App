# Welcome to Bookstored
This is my book review app where users can read, post update and delete book reviews. I used Openlibrary's APIs to fetch book covers automatically based on the title of the book the user inputs. This application uses PostgreSQL so posts will persist between sessions. I used express.js to write the server side code and used axios to handle API requests.

## Log in/Sign up
This app will ask you to log in or sign up by creating an account with a username (your email address) and a password. These passwords are now hashed and salted for additional security. I use express session to create a session cookie when the user logs in. this session expires after 24 hours meaning the user won't be asked to log in again until after 24 hours has passed. I also use passport's local strategy to verify authetication of users.

## Updating/Deleting posts
Users can update and delete posts that they have created, but cannot update and delete the posts made by other users. I use passport to serialize and deserialize the user info so the code can check if the user ID is associated with the post ID via postgreSQL.

## TODO list
- Add more animations.
- Improve overall responsiveness.

### Feedback
feeback and any suggestions on improving the app are welcome.
