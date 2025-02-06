import bcrypt


#We will need to store the HASHED passwords in the database

def hash_password(plain_password):
    password_bytes = plain_password.encode('utf-8')
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()  #this can be adjusted
    hashed_password = bcrypt.hashpw(password_bytes, salt)
    return hashed_password

def verify_password(plain_password, stored_hash):
    password_bytes = plain_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, stored_hash)
