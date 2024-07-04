-- Database creation
CREATE DATABASE IF NOT EXISTS referral;

-- users table creation
CREATE TABLE IF NOT EXISTS users(
    userId VARCHAR(200) NOT NULL,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phoneNumber VARCHAR(50) NOT NULL,
    role ENUM ('user', 'Admin') DEFAULT 'user',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(email),
    PRIMARY KEY(userId)
);

ALTER TABLE users ADD referralCode VARCHAR(50) NOT NULL UNIQUE;

ALTER TABLE users ADD password VARCHAR(1000) NOT NULL;

ALTER TABLE users ADD avatar VARCHAR(5000) NOT NULL DEFAULT="https://cdn.icon-icons.com/icons2/317/PNG/512/user-female-icon_34335.png";

ALTER TABLE users ADD status ENUM ('inactive', 'active') DEFAULT 'inactive';

-- ALTER TABLE users ADD isVerified ENUM ('false', 'true') DEFAULT 'false';

ALTER TABLE users
ADD COLUMN resetToken VARCHAR(300),
ADD COLUMN resetTokenExpiry TIMESTAMP;


ALTER TABLE users ADD totalBalance DECIMAL (10,2) DEFAULT 0.00;

ALTER TABLE users ADD userInactive VARCHAR(20);

ALTER TABLE users
ADD COLUMN isVerified ENUM ('false', 'true') DEFAULT 'false',
ADD COLUMN lastVerified TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users
ALTER COLUMN isActive SET DEFAULT TRUE;

-- Ensure the event scheduler is enabled
SET GLOBAL event_scheduler = ON;

-- Modify the users table to add necessary columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS isVerified ENUM ('false', 'true') DEFAULT 'false',
ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create the event to delete unverified users
CREATE EVENT IF NOT EXISTS `DeleteUnverifiedUsers`
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM users
  WHERE isVerified = FALSE
  AND TIMESTAMPDIFF(MINUTE, createdAt, NOW()) > 10;

-- using mysql package
  ALTER USER 'customuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'yourpassword';
FLUSH PRIVILEGES;


-- referrals table table creation
CREATE TABLE IF NOT EXISTS referrals(
    referralId VARCHAR(200) NOT NULL,
    referrerId VARCHAR(200) ,
    referredId VARCHAR(200) ,
    referralCode VARCHAR(50) ,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(referralId),
    FOREIGN KEY (referrerId) REFERENCES users(userId),
    FOREIGN KEY (referredId) REFERENCES users(userId),
    FOREIGN KEY (referralCode) REFERENCES users(referralCode)
);

-- rewards table
CREATE TABLE IF NOT EXISTS rewards(
    rewardId VARCHAR(200) NOT NULL,
    userId VARCHAR(200) NOT NULL,
    rewardType VARCHAR(50) NOT NULL,
    rewardAmount DECIMAL(10, 2) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(rewardId),
    FOREIGN KEY (userId) REFERENCES users(userId)
);

-- activity table
CREATE TABLE IF NOT EXISTS activity(
    activityId VARCHAR(200) NOT NULL,
    userId VARCHAR(200) NOT NULL,
    referralId VARCHAR(200), -- Optional: Link to referral if the activity is related to a referral
    activityType ENUM('signup', 'deposit', 'other') NOT NULL, -- Different types of activities
    activityStatus ENUM('pending', 'completed') DEFAULT 'pending', -- Status of the activity
    activityAmount DECIMAL(10, 2), -- Amount for activities involving transactions (e.g., deposits)
    activityData JSON, -- Additional data related to the activity
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(activityId),
    FOREIGN KEY (userId) REFERENCES users(userId),
    FOREIGN KEY (referralId) REFERENCES referrals(referralId)
);

