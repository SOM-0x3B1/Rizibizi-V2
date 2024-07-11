# Rizibizi 2.0

A fairly advanced music bot for Discord.

## Highlighted features
<img align="right" src="https://music.onekilobit.eu/media/pot-lid3.gif">

- YouTube, Spotify and Discord attachment support
- Real-time effects (bass boost, nightcore, 8D)
- Local and global playlist management
- Web GUI for playlist editing


## Commands

### Music
- **/play** - Loads music from an online source
  - **query** - The url, or searchterms you want to use (required)
  - **specify** - The search engine you want to use (partially optional) 
    - "! YouTube search" - (recommended)
    - "! Spotify search" - (recommended)
    - ... - URLs are automatically recognised (optional)
  - **loop** - Should the loaded track(s) be looped? (optional)
  - **shuffle** - Should the loaded track(s) be shuffled? (optional)
- **/plist** - Playlist management
  - **create** - Gives you a playlist creating modal
    - **from_queue** - Fills the new playlist with the queue after creation (optional)
  - **add** - Add track(s) to a playlist
    - **id** - The ID of the playlist (required)
    - **add_type** - What do you want to add? (required)
      - "current_song"
      - "queue"
      - "url"
        - **url** (required)
      - "other_playlist" - Basically clones playlist 'B' into playlist 'A'
        - **id** - The ID of playlist 'B' (required)
  - **edit** - Gives you your *login key* and the website (https://music.onekilobit.eu/) where you can edit your playlist
  - **list** - Lists playlists
    - **list_type** - Which list do you want to see? (required)
      - "server_playlists" - Playlists of the server
      - "my_playlists" - Playlists created by you, including from other servers
  - **info** - Details about a playlist
    - **id** - The ID of the playlist (required)
  - **play** - Plays a playlist
    - **id** - The ID of the playlist (required)
    - **loop** - Should the loaded track(s) be looped? (optional)
    - **shuffle** - Should the loaded track(s) be shuffled? (optional)
  - **delete** - Deletes a playlist
    - **id** - The ID of the playlist (required)
- **/check_queue** - Displays the queue including songs, thumbnails, loops, etc
  - **page** - (optional)
- **/effect** - Applies real-time effects to the queue
  - **filter** - The effect (required)
    - "soft bass boost"
    - "hard bass boost"
    - "nigthcore"
    - "8D"
- **/loop** - Loops something(s)
  - **mode** - (required)
    - "off"
    - "loop current song"
    - "loop queue"
    - "autoplay related songs"
- **/shuffle** - Shuffles the queue
- **/pause** - Pauses the song
- **/resume** - Resumes the song
- **/progress** - Shows a fancy progress bar
- **/skip** - Skip a song / multiple songs
  - **skip_to_index** - Index of the song in the queue to jump to (optional)
- **/replay** - Replays the previously played song (doesn't work when loop is on)
- **/remove** - Removes a song from the queue
  - **index** - (required)
- **/clear_queue** - Clears the queue
- **/quit** - Deletes the queue and disconnects
  
### Other
- **/about** - Info about the bot
- **/ping** - Measures the latency of the bot in milliseconds

