<?php
$config = json_decode(file_get_contents('config.json'));

spl_autoload_register(function ($class_name) {
	include 'assets/php/' . $class_name . '.php';
});

$database = new Database();

if (!$database->doesExist()) {
	$database->install();
}

if (isset($_GET['index'])) {
	$indexer = new Indexer($config, $database);
	$indexer->index();
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title>Waiata</title>
	<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
	<main>
		<div class="title-holder"><div class="title">Library</div></div>
		<div class="browser"></div>
		<div class="player">
			<div class="minimizer"></div>
			<div class="left"></div>
			<div class="center">
				<div class="info">
					<div class="track"></div>
					<div class="artist"></div>
				</div>
				<div class="controls">
					<div class="seekbar-holder">
						<div class="time-elapsed"></div>
						<input type="range" class="seekbar">
						<div class="time-total"></div>
					</div>
					<div class="buttons">
						<button name="shuffle" class="button button--shuffle small">Shuffle</button>
						<button name="prev" class="button button--prev">Previous</button>
						<button name="play" class="button button--play">Play</button>
						<button name="next" class="button button--next">Next</button>
						<button name="volume" class="button button--volume small">Volume <div class="">
							<input type="range" class="volume-slider" value="50" max="100">
						</div></button>
					</div>
				</div>
			</div>
			<div class="right"></div>
		</div>
	</main>
	<script src="assets/js/script.js"></script>
</body>
</html>
