<?php

require 'Database.php';
$database = new Database();

$library = [
	'artists' => [],
	'albums' => [],
	'songs' => []
];

// Artists
$query = "SELECT * FROM `wai_artists`;";

$query_result = $database->query($query);

while ($row = $query_result->fetchArray(SQLITE3_ASSOC) ) {
	$library['artists'][] = $row;
}

// Albums
$query = "SELECT * FROM `wai_albums`;";

$query_result = $database->query($query);

while ($row = $query_result->fetchArray(SQLITE3_ASSOC) ) {
	$library['albums'][] = $row;
}

// Songs
$query = "SELECT * FROM `wai_songs`;";

$query_result = $database->query($query);

while ($row = $query_result->fetchArray(SQLITE3_ASSOC) ) {
	$library['songs'][] = $row;
}

echo json_encode($library);
