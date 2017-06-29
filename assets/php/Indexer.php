<?php

require_once(__DIR__ . '/getid3/getid3.php');

class Indexer {
	private $config;

	function __construct($config, $database) {
		$this->config = $config;
		$this->getID3 = new getID3;
		$this->database = $database;

		$this->artists = [];
		$this->albums  = [];
		$this->songs   = [];
	}

	function getArtist($search_text) {
		return array_filter($this->artists, function($el) use ($search_text) {
			return (strpos($el['name'], $search_text) !== false);
		});
	}

	function getAlbum($search_text) {
		return array_filter($this->albums, function($el) use ($search_text) {
			return (strpos($el['title'], $search_text) !== false);
		});
	}

	function index() {
		// Truncate all tables
		$handle = $this->database->exec('delete from wai_artists; vacuum');
		$handle = $this->database->exec('delete from wai_albums; vacuum');
		$handle = $this->database->exec('delete from wai_songs; vacuum');

		$rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($this->config->library_location));
		$files = array();

		foreach ($rii as $file) {
			if ($file->isDir()){
				continue;
			}

			$file_path = $file->getPathname();

			$files[] = $file_path;

			$info = $this->getID3->analyze($file_path);

			if (isset($info['playtime_string'])) {

				$images = glob(dirname($file_path) . '/*.{jpg,png,gif}', GLOB_BRACE);

				$cover_path = (isset($images[0]) ? $images[0] : '');

				//print_r($info);

				$key = key($info['tags']);

				$tags = $info['tags'][$key];

				$images2 = glob(dirname(dirname($file_path)) . '/*.{jpg,png,gif}', GLOB_BRACE);

				$cover_path2 = (isset($images2[0]) ? $images2[0] : '');

				$new_artist = [
					'name' => $tags['artist'][0],
					'cover' => $cover_path2
				];

				$artist_id = uniqid(true);

				if (!in_array($new_artist, $this->artists)) {


					$this->artists[$artist_id] = $new_artist;
				} else {
					$new_artist = false;
				}

				$date = strtok((isset($tags['date'])? $tags['date'][0] : '') | (isset($tags['creation_date'])? $tags['creation_date'][0] : '') | (isset($tags['year'])? $tags['year'][0] : ''), '/');
				$track = strtok((isset($tags['track_number'])? $tags['track_number'][0] : '') | (isset($tags['tracknumber'])? $tags['tracknumber'][0] : ''), '/');

				$new_album = [
					'title'  => $tags['album'][0],
					'artist' => $tags['artist'][0],
					'artist_id' => key($this->getArtist($tags['artist'][0])),
					'date'   => $date,
					'cover'  => $cover_path
				];

				$album_id = uniqid(true);

				if (!in_array($new_album, $this->albums)) {
					$this->albums[$album_id] = $new_album;
				} else {
					$new_album = false;
				}

				$new_song = [
					'path'   => $file_path,
					'track'  => $track,
					'title'  => $tags['title'][0],
					'artist' => $tags['artist'][0],
					'artist_id' => key($this->getArtist($tags['artist'][0])),
					'album'  => $tags['album'][0],
					'album_id' => key($this->getAlbum($tags['album'][0])),
					'date'   => $date,
					'length' => $info['playtime_string'],
					'cover'  => $cover_path
				];

				$song_id = uniqid(true);

				if (!in_array($new_song, $this->songs)) {
					$this->songs[$song_id] = $new_song;
				} else {
					$new_song = false;
				}

				if ($new_artist !== false) {
					$query = '
					INSERT INTO
					`wai_artists`
					(
						`uid`,
						`name`,
						`cover`
					)
					VALUES
					(
						:uid,
						:name,
						:cover
					);';

					$handle = $this->database->prepare($query);

					$handle->bindParam(':uid', $artist_id, SQLITE3_TEXT);
					$handle->bindParam(':name', $new_artist['name'], SQLITE3_TEXT);
					$handle->bindParam(':cover', $new_artist['cover'], SQLITE3_TEXT);

					$handle->execute();
				}

				if ($new_album !== false) {
					$query = '
					INSERT INTO
					`wai_albums`
					(
						`uid`,
						`title`,
						`artist`,
						`artist_id`,
						`date`,
						`cover`
					)
					VALUES
					(
						:uid,
						:title,
						:artist,
						:artist_id,
						:date,
						:cover
					);';

					$handle = $this->database->prepare($query);

					$handle->bindParam(':uid', $album_id, SQLITE3_TEXT);
					$handle->bindParam(':title', $new_album['title'], SQLITE3_TEXT);
					$handle->bindParam(':artist', $new_album['artist'], SQLITE3_TEXT);
					$handle->bindParam(':artist_id', $new_album['artist_id'], SQLITE3_TEXT);
					$handle->bindParam(':date', $new_album['date'], SQLITE3_TEXT);
					$handle->bindParam(':cover', $new_album['cover'], SQLITE3_TEXT);

					$handle->execute();
				}

				if ($new_song !== false) {
					$query = '
					INSERT INTO
					`wai_songs`
					(
						`uid`,
						`path`,
						`track`,
						`title`,
						`artist`,
						`artist_id`,
						`album`,
						`album_id`,
						`date`,
						`length`,
						`cover`
					)
					VALUES
					(
						:uid,
						:path,
						:track,
						:title,
						:artist,
						:artist_id,
						:album,
						:album_id,
						:date,
						:length,
						:cover
					);';

					$handle = $this->database->prepare($query);

					$handle->bindParam(':uid', $song_id, SQLITE3_TEXT);
					$handle->bindParam(':path', $new_song['path'], SQLITE3_TEXT);
					$handle->bindParam(':track', $new_song['track'], SQLITE3_TEXT);
					$handle->bindParam(':title', $new_song['title'], SQLITE3_TEXT);
					$handle->bindParam(':artist', $new_song['artist'], SQLITE3_TEXT);
					$handle->bindParam(':artist_id', $new_song['artist_id'], SQLITE3_TEXT);
					$handle->bindParam(':album', $new_song['album'], SQLITE3_TEXT);
					$handle->bindParam(':album_id', $new_song['album_id'], SQLITE3_TEXT);
					$handle->bindParam(':date', $new_song['date'], SQLITE3_TEXT);
					$handle->bindParam(':length', $new_song['length'], SQLITE3_TEXT);
					$handle->bindParam(':cover', $new_song['cover'], SQLITE3_TEXT);

					$handle->execute();
				}
			}
		}

		// print_r($this->artists);
		// print_r($this->albums);
		// print_r($this->songs);
	}
}
