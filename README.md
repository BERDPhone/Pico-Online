Pico-Online is a zero hassle way of programming the raspberry pi pico. All one needs to have is a Raspberry Pi Pico (any variant), a Raspberry Pi (computer), and a git repository. Once you have that, it is easy to build, test, run, and debug code.

# Installation
First use the basic setup script for your Raspberry Pi provided in the getting started guide: 
```
sudo apt install wget 
wget https://raw.githubusercontent.com/raspberrypi/pico-setup/master/pico_setup.sh
chmod +x pico_setup.sh
./pico_setup.sh
```
\
Second clone this git repository to your Raspberry Pi: 
```
sudo apt install git
git clone https://github.com/BERDPhone/Pico-Online
```
\
Finally install nodejs and yarn to build the project to your own config options. \
See guide [here](https://github.com/nvm-sh/nvm#installing-and-updating) for installing nvm and nodejs. After that run the following commands within the Pico-Online directory.
```
npm install --global yarn
yarn global add serve
cd client && yarn build && serve -s build
```
**Note: yarn build may take very long, and even fail on any hardware below the Raspberry Pi 4. Currently making fix for that issue.**
\
\
In another terminal once the `serve -s build` process is running, run the following commands within the Pico-Online directory
```
cd api && yarn start
```
\
\
Your web interface to the pico is nearly done. Now just the wiring from the Pico to the Raspberry Pi is needed. This enables the user to build the code remotely, and even get UART communication back!

The diagram below shows how to wire it.

![This is the wiring diagram](resources/images/conection.png?raw=true)


Here is what the interface looks like

![This is the interface](resources/images/interface.png?raw=true)
