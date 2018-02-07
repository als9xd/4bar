# Table of Contents

[Setup a Development Environment](#setup-a-development-environment)

[Setup the Production Environment](#setup-the-production-environment)

[Working with the Production Server](#working-with-the-production-server)
- [Access the Production Server](#access-the-production-server)
- [Stop the Production Webserver](#stop-the-production-webserver)
- [Start the Production Webserver](#start-the-production-webserver)

[Working with the Repository](#working-with-the-repository)
- [Setup Git](#setup-git)
- [Download the Repository](#download-the-repository)
- [Upload Code to the Repository](#upload-code-to-the-repository)
- [Directory Structure](#directory-structure)

[Postgresql Database](#postgresql-database)
- [Setup the Postgresql Database](#setup-the-postgresql-database)

[Node.js Webserver](#nodejs-webserver)
- [Setup the Node.js Webserver](#setup-the-nodejs-webserver)
- [Start the Node.js Webserver](#start-the-nodejs-webserver)
- [Change the Node.js Webserver's Operating Environment](#change-the-nodejs-webservers-operating-environment)

[FAQ](#faq)
    
# Setup a Development Environment
1. [Setup Postgresql Database](#setup-the-postgresql-database)
2. [Setup Git](#setup-git)
3. [Download the Repository](#download-the-repository)
4. [Setup the Node.js Webserver](#setup-the-nodejs-webserver)
5. [Start the Node.js Webserver](#start-the-nodejs-webserver)

# Setup the Production Environment
- Debian
    1. [Access the Production Server](#access-the-production-server)
    2. [Setup the Postgresql Database](#setup-the-postgresql-database)
        * The 'postgres' user's password should be the same as the password you used to ssh with.
    3. [Setup Git](#setup-git)
    4. [Download the Repository](#download-the-repository)
    5. Login as root using ```sudo -i```
    6. [Set the Node.js Webserver Operating Environment to 'Production'](#change-the-nodejs-webservers-operating-environment)
    7. [Start the Production Webserver](#start-the-production-webserver)

# Working with the Production Server

### Access the Production Server

- Windows
    1. Download putty from here https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html and install
    2. Open putty and connect using 4bar.org as the hostname

- osx/linux
    1. Open a terminal and type ```ssh username@4bar.org``` replacing 'username' with the appropriate account

Note: The username and password were shared in the discord channel

### Stop the Production Webserver

1. Get the process id by typing ```ps aux | grep node ``` which should return something like: ```root 6844 0.0 0.0 49260 3484 pts/0 T 19:15 0:00 sudo node index.js --password p```. The process Id in this case is 6844
2. type ```sudo kill 6844``

### Start the Production Webserver

1. [Make Sure the Webserver isn't already running](#stop-the-production-webserver)
2. cd to '4bar/'
3. type ```sudo node index.js --password p &``` where p is the password for the postgresqsl database

# Working with the Repository

### Setup Git
1. Download git here https://git-scm.com/downloads and install

### Download the Repository

- First time download
    1. type ```git clone https://git.mst.edu/als9xd/4BAR``` from within the directory that you want it downloaded to

- Download and overwrite local files
    1. cd '4bar\'
    2. type ```git fetch```
    3. type ```git reset --hard origin/master```

Note: this won't remove untracked files or folders

- Download and Attempt to Merge with local files
    1. cd '4bar\'
    2. type ```git pull```

#### Upload Code to the Repository

1. Change directory to 4bar\ 
2. type ```git pull``` to try to merge your local code with the newest available code on the repository
3. type ```git add .``` to add all the files in your current directory
4. type ```git commit -m "commit message"``` where 'commit message' is what you have updated or changed
5. type ```git push``` to push your local code to the repository

Note: before you push your code make sure you aren't pushing any icons/wallpapers

### Directory Structure

4BAR  
├───ssl    
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── dev  
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── cert.pem    
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── key.pem   
├───../ssl    
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── fullchain.pem      
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── privkey.pem  
├───community_data  
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── icons  
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── wallpapers  
├───node_modules  
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── ...  
├───public  
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── css  
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── js  
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── *.html  
├───views  
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── css  
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── js  
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── *.handlebars  
├───connectors    
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── pg_connector.js  
├───helpers  
│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─── passwords_helper.js     
├───config.js  
├───package.json    
└───index.js  

- 4BAR/ssl/dev - contains the self signed ssl certificate and key used when the 
 webserver is run within the dev (default) context

- 4BAR/../ssl - contains the letsencrypt signed ssl certficate and key used when
the webserver is run within the prod context

- 4BAR/community_data - Contains all files that communities upload 

- 4BAR/community_data/icons - Contains all the icons for communities

- 4BAR/community_data/wallpapers - Contains all the wallpapers for communities

- 4BAR/node_modules - Contains all the modules that are required by index.js

- 4BAR/public - Contains all the client-side files that don't require user 
authentication. They don't necessarily have to all be .html they could also be
.handlebars files

- 4BAR/views - Contains all the client-side files that require user authentication. 
They don't necessarily have to all be .handlebars they could also be .html files

- 4BAR/connectors - Contains custom javascript packages that provide some interface to an node package

- 4BAR/connectors/pg_connectors.js - Package that provides an interface to the 'pg' postgresql node package

- 4BAR/helpers - Contains custom javascript packages that provide some non-node.js specific functionality

- 4BAR/helpers/passwords_helper.js - Provides some added functionality for manipulating passwords

- 4BAR/config.js - Contains configuration settings for webserver envirnments

- 4BAR/package.json - Contains all the data used by npm (node package manager) that
is required to get the node server up and running

- 4BAR/index.js - This is the main node.js file (server)

- 4BAR/public,views/js, 4BAR/public,views/css - These contain clientside javascript and css files for their parent
directory. All are publically avaiable to clients without authentication

# Postgresql Database

### Setup the Postgresql Database
- GUI
    1. Download postgresql from here https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
    2. Run the installer. When prompted for password use 'pass' otherwise spam next.
    3. Open pgAdmin4
    4. Create a database named '4bar' with 'postgres' as the owner 

- Headless
    * osx/linux
        1. Install postresql through whatever method is supplied for your os
        2. To open the postgresql prompt type ```sudo -u postgres psql```
        3. To change the 'postgres' user's password type ```\password postgres```. Then enter 'pass' as the password.
        4. To create the database type ```CREATE DATABASE "4bar"```
        5. To change the database owner type ```ALTER DATABASE "4bar" OWNER TO postgres```
        6. To exit the psql promp type ```\q```

Note: These are just default settings. They be changed within 'config.js'

Issues: Right now connections aren't closed when node exits. This means in order to delete the database you must first
restart/stop the postgresql service.

# Node.js Webserver

### Setup the Node.js Webserver
1. Install node.js (8.9.4 LTS) from here https://nodejs.org/en/
    * If using windows you may have to start a new cmd prompt as administrator
3. Change directory to 4bar\
4. To install the webserver dependencies type ```npm install```

### Start the Node.js Webserver

- Windows
    1. cd to '4bar/'
    2. type ```node index.js``` within an admin command prompt

- OSX/Linux
   1. cd to '4bar/'
   2. type ```sudo node index.js```

The webserver should then be available at https://localhost

### Change the Node.js Webserver's Operating Environment

The two currently available environments are:

 1. development (default)
    - Use unsigned ssl certificate within '4bar/ssl/dev' directory
    - Saved postgresql credentials
 2. production
    - Use signed ssl certifcate within '4bar/../ssl' directory
    - Enter postgresql credentials on startup

Change them using the following: 

- Windows
    1. type ```SETX NODE_ENV=production```
- Debian
    1. type  ```export "NODE_ENV=production" >> ~/profile```
    2. relogin/restart shell to appply


# FAQ
- When I try to login or register 4bar gets stuck loading.
	* You may be having an issue connecting to the database. There should have been an error message that says what settings were used to attempt the connection 

- When I try to start the webserver I get this error ```Error: listen EACCES 0.0.0.0:80```
    * Make sure you are run with administrative priveleges (sudo on osx/linux, admin prompt on windows)

