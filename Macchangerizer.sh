#!/bin/bash

# Macchangerizer.sh script by Manuel Berrueta
# Use to automate persistence of mac address spoofing 
# prior to connecting to WiFi Access Point

# We will stop the network manager service and bring down wlan0,
# so that after the mac address is modified the change can be persistent effect.
# Then we will use macchanger to spoof the mac address of wlan0
# We finish by starting the network manager service and bringing wlan0 back up. 

# NOTE: wlan0 is my WiFi adapter which is pretty common, 
# however it might be different in your case, 
# especially if you are using an external or more than one wifi adapter.

# To identify your WiFi adapter use the command ifconfig or ip adddr
# If it is to be something other than wlan0, 
# modify the code to the name of your WiFi adapter.
iface=$1
#Check current MAC address settings using macchanger
macchanger -s "${iface}"
#Stop the network manager service
sudo service network-manager stop
#Bring down wlan0 
sudo ifconfig "${iface}" down
#Assign new random MAC address
sudo macchanger -a "${iface}"
#Check that macchanger indeed spoofed the MAC address
macchanger -s "${iface}"
#Bring adapter back up
sudo ifconfig "${iface}" up
#Bring network manager service back up
sudo service network-manager start

# NOTE: I recommend that after you connect to the access point 
# you use the command macchanger -s wlan0 to double check that you are still
# indeed using the spoofed MAC address and that the change was persistent.
