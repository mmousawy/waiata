<?php
class Database extends SQLite3 {
	private $exists = false;
	private $database_path = '';

	function __construct() {
		$this->database_folder = realpath(dirname(__FILE__)) . '/../../db/';
		$this->database_path = $this->database_folder . 'waiata.db';

		if (!file_exists($this->database_path)) {
			if (!is_dir($this->database_folder)) {
				mkdir($this->database_folder, 0700, true);
			}

			if (!file_exists($this->database_folder . '.htaccess')) {
				file_put_contents($this->database_folder . '.htaccess', 'deny from all');
			}
		}

		$this->open($this->database_path);

		if (filesize($this->database_path) > 0) {
			$this->exists = true;
		}
	}

	function install() {
		$response = [
			'status' => 0,
			'message' => 'None'
		];

		if (file_exists('../db/marker.db') && filesize('../db/marker.db') > 0) {
			$response['status'] = -1;
			$response['message'] = 'Database already exists!';
		} else {
			$query = <<<SQL
BEGIN TRANSACTION;
CREATE TABLE `wai_artists` (
	`id` INTEGER PRIMARY KEY AUTOINCREMENT,
	`uid` VARCHAR(13) NULL DEFAULT NULL,
	`name` VARCHAR(255) NULL DEFAULT NULL,
	`cover` VARCHAR(512) NULL DEFAULT NULL
);
CREATE TABLE `wai_albums` (
	`id` INTEGER PRIMARY KEY AUTOINCREMENT,
	`uid` VARCHAR(13) NULL DEFAULT NULL,
	`title` VARCHAR(255) NULL DEFAULT NULL,
	`artist` VARCHAR(255) NULL DEFAULT NULL,
	`artist_id` VARCHAR(13) NULL DEFAULT NULL,
	`date` VARCHAR(4) NULL DEFAULT NULL,
	`cover` VARCHAR(512) NULL DEFAULT NULL
);
CREATE TABLE `wai_songs` (
	`id` INTEGER PRIMARY KEY AUTOINCREMENT,
	`uid` VARCHAR(13) NULL DEFAULT NULL,
	`path` VARCHAR(2048) NULL DEFAULT NULL,
	`track` INT(2) NULL DEFAULT NULL,
	`title` VARCHAR(255) NULL DEFAULT NULL,
	`artist` VARCHAR(255) NULL DEFAULT NULL,
	`artist_id` VARCHAR(13) NULL DEFAULT NULL,
	`album` VARCHAR(255) NULL DEFAULT NULL,
	`album_id` VARCHAR(13) NULL DEFAULT NULL,
	`date` VARCHAR(4) NULL DEFAULT NULL,
	`length` VARCHAR(16) NULL DEFAULT NULL,
	`cover` VARCHAR(512) NULL DEFAULT NULL
);
CREATE UNIQUE INDEX `unique_artist_id` ON `wai_artists` (`uid`);
CREATE UNIQUE INDEX `unique_album_id` ON `wai_albums` (`uid`);
CREATE UNIQUE INDEX `unique_song_id` ON `wai_songs` (`uid`);
COMMIT;
SQL;
			$handle = $this->exec($query);

			if (!$handle) {
				$response['status'] = -1;
				$response['message'] = 'Install could not setup the database.';
			} else {
				$response['status'] = 1;
			}

		}

		return $response;
	}

	public function doesExist() {
		return $this->exists;
	}
}
