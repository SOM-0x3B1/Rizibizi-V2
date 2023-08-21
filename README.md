# Rizibizi 2.0

<img align="right" src="https://music.onekilobit.eu/media/pot-lid3.gif">
A fairly advanced music bot for Discord maintained by Onekilobit Servers.

## Highlighted features
- YouTube, Spotify and Discord attachment support
- Real-time effects (bass boost, nightcore, 8D)
- Local and global playlist management
- Web GUI for playlist editing


## Commands

### Music
- **/play** - Load music from an online source
  - **query** - The url, or searchterms you want to use (required)
  - **specify** - The search engine you want to use (optional) 
    - "! YouTube search" - (recommended)
    - "! Spotify search" - (recommended)
    - ... - URLs are automatically recognised (optional)
  - **loop** - Should the loaded track(s) be looped? (optional)
  - **shuffle** - Should the loaded track(s) be shuffled? (optional)
- **/plist** - Playlist management
  - **create** - Gives you a playlist creating modal
    - **from_queue** - Fills the new playlist with the queue after creation (optional)
  - **add**
    - **id**
    - **add_type**
      - "current_song"
      - "queue"
      - "url"
      - "other_playlist"
  - **edit**
  - **list**
    - **list_type**
      - "server_playlists"
      - "my_playlists"
  - **info**
    - **id**
  - **play**
    - **id** 
    - **loop**
    - **shuffle**
  - **delete**
    - **id**
- **/check_queue**
  - **page**
- **/effect**
  - **filter**
    - "soft bass boost"
    - "hard bass boost"
    - "nigthcore"
    - "8D"
- **/loop**
  - **mode**
    - "off"
    - "loop current song"
    - "loop queue"
    - "autoplay related songs"
- **/shuffle**
- **/pause**
- **/resume**
- **/progress**
- **/skip**
  - **skip_to_index**
- **/replay**
- **/clear_queue**
- **/quit**
  
### Other
- **/about**
- **/ping**

