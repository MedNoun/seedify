# Project's title :
# **Seedify**

# Description
The BitTorrent Client is a revolutionary file-sharing solution that embraces a decentralized approach to offer remarkable benefits in terms of speed and efficiency. By leveraging the decentralized nature of the BitTorrent protocol, this client enables users to experience exceptionally fast downloads compared to traditional centralized systems.

Through its decentralized architecture, the BitTorrent Client achieves increased download speeds by simultaneously downloading file fragments from multiple peers. This parallelization allows users to tap into the combined bandwidth of numerous peers, resulting in significantly accelerated downloads. Additionally, the client intelligently selects the rarest file fragments first, prioritizing their retrieval and ensuring users quickly obtain the most critical parts of the file.


# Features developed :

* Getting peers from trackers 
* Downloading resources from multiple torrent files from peers
* Seeding pieces of files to other peers

# Technology :
we used typescript for developping this project for many reasons even the existing solutions use python and C++ :
* Readability and Maintainability
* Cross-Platform Development
* Syntax simplicity

# Faced challenges : 
* Reading torrent files and using the bencode 
* Manipulating buffers to use the bitorrent specification
* Manipulating connections between peers with tcp and udp protocols
* Using coding best practices like the OCP(Open Closed Principle)
* Using SRP (Single Responsablility Principle)

# How to Install and Run the Project
1. git clone https://github.com/MedNoun/seedify.git
2. cd seedify
3. npm install 
4. put the torrent files into the "torrent-files" directory
5. then npm start src/torrent-files/torrentName1 src/torrent-files/torrentName2

 **Note**
the second torrent argument is optional


# **Class diagram** :

![Alt Text](src/assets/Screenshot%20from%202023-04-25%2014-00-33.png)
