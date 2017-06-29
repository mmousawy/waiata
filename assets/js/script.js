'use strict';

(() => {
	let library = null;
	const main = document.querySelector('main');
	const title = document.querySelector('.title');
	const browser = document.querySelector('.browser');
	const player = document.querySelector('.player');
	const player_left = document.querySelector('.player .left');
	const player_right = document.querySelector('.player .right');
	const player_minimizer = document.querySelector('.player .minimizer');
	const info_track = document.querySelector('.info .track');
	const info_artist = document.querySelector('.info .artist');
	const info_time_elapsed = document.querySelector('.seekbar-holder .time-elapsed');
	const info_seekbar = document.querySelector('.seekbar-holder .seekbar');
	info_seekbar.max = 320;
	const info_time_total = document.querySelector('.seekbar-holder .time-total');
	const audio = new Audio();
	let timer;

	audio.volume = .5;

	let current_song;
	let current_track_number = 0;
	let shuffle = false;
	let queue = [];
	let queue_shuffled = [];

	audio.addEventListener('loadstart', (event) => {
		info_time_total.textContent = current_song.length;

		player_left.innerHTML = '<div class="pane__image"></div>';
		const imageElement = player_left.querySelector('.pane__image');
		imageElement.style.backgroundImage = `url("${current_song.cover || ''}")`;

		highLightSong(current_song.uid);

		main.classList.add('is-loading');
		main.classList.add('can-play');

		button_play.disabled = true;

		info_time_elapsed.textContent = '0:00';

		info_seekbar.disabled = true;

		info_seekbar.value = 0;
	});

	audio.addEventListener('canplaythrough', (event) => {
		info_seekbar.disabled = false;
		main.classList.remove('is-loading');
		button_play.disabled = false;
	});

	audio.addEventListener('waiting', (event) => {
		info_seekbar.disabled = true;
		main.classList.add('is-loading');
	});

	audio.addEventListener('playing', (event) => {
		main.classList.add('is-playing');

		//updateTime();
	});

	audio.addEventListener('pause', (event) => {
		if (!main.classList.contains('is-seeking')) {
			main.classList.remove('is-playing');
		}
	});

	audio.addEventListener('ended', (event) => {
		const list = (shuffle? queue_shuffled : queue);

		if (current_track_number < list.length) {
			current_track_number++;
			skipToSong(list[current_track_number], true);
		} else {
			skipToSong(list[0]);
		}
	});

	audio.addEventListener('timeupdate', (event) => {
		if (!main.classList.contains('is-seeking')) {
			updateTime();
		}
	});

	const highLightSong = (uid) => {
		const all_prev_occurences = document.querySelectorAll(`.item.is-playing`);

		all_prev_occurences.forEach((element) => {
			element.classList.remove('is-playing');
		});

		const all_song_occurences = document.querySelectorAll(`.item[data-uid="${uid}"]`);

		all_song_occurences.forEach((element) => {
			element.classList.add('is-playing');
		});
	};

	const selectItem = (item = false) => {
		const all_prev_occurences = document.querySelectorAll(`.item.is-selected`);

		all_prev_occurences.forEach((element) => {
			element.classList.remove('is-selected');
		});

		item && item.classList.add('is-selected');
	};

	const skipToSong = (song, auto_play = false) => {
		current_song = song;

		queue = library.songs.filter(item => {
			return item.album_id == song.album_id;
		})
		.sort((a, b) => a.track - b.track);

		info_track.textContent = song.title;
		info_artist.textContent = song.artist;

		audio.pause();
		audio.currentTime = 0;
		highLightSong(current_song.uid);

		audio.src = song.path;

		auto_play && audio.play();
		auto_play && (document.title = `${song.artist} - ${song.title}`);

		info_seekbar.value = 0;

		if (current_track_number >= queue.length - 1) {
			button_next.disabled = true;
		} else {
			button_next.disabled = false;
		}

		if (current_track_number == 0) {
			button_prev.disabled = true;
		} else {
			button_prev.disabled = false;
		}
	};

	const updateTime = () => {
		//clearTimeout(timer);

		if (audio.readyState > 2) {
			const currentTime = audio.currentTime;
			let currentSeconds = parseInt(currentTime) % 60;
			currentSeconds = (currentSeconds < 10)? '0' + currentSeconds : currentSeconds;
			const currentMinutes = parseInt(currentTime / 60);

			info_time_elapsed.textContent = `${currentMinutes}:${currentSeconds}`;
			info_seekbar.value = (currentTime / audio.duration) * 320;
		}
	};

	const pane = document.createElement('div');
	pane.classList.add('pane');
	pane.innerHTML = '<div class="pane__image"></div><div class="pane__title"></div>';

	const listItem = document.createElement('div');
	listItem.classList.add('item');
	listItem.innerHTML = '<div class="item__track"></div><div class="item__title"></div><div class="item__length"></div>';

	const getLibrary = () => {
		const request = new XMLHttpRequest();
		request.open('GET', 'assets/php/getLibrary.php', true);

		request.onload = function() {
			if (request.status >= 200 && request.status < 400) {
				library = JSON.parse(request.responseText);

				console.log(library);
				window.addEventListener('hashchange', hashChangeHandler);
				hashChangeHandler();
			}
		};

		request.send();
	};

	const hashChangeHandler = () => {
		if (window.location.hash.length > 2) {
			let hashParts = window.location.hash.slice(1).split('/');
			const hashPartsLinks = hashParts.slice();
			hashParts = hashParts.map(part => decodeURI(part));

			for (let i = 0; i < hashPartsLinks.length; i++) {
				let partURL = `#${hashPartsLinks[i]}`;

				if (i > 0) {
					const previousParts = hashParts.slice(0, i);
					partURL = `#${previousParts}/${hashPartsLinks[i]}`;
				}

				hashPartsLinks[i] = `<a href="${partURL}">${hashParts[i]}</a>`;
			}

			changeTitle(' / ' + hashPartsLinks.join(' / '));

			if (hashParts.length == 1) {
				showAlbums(hashParts[0]);
			}
			if (hashParts.length == 2) {
				showSongs(hashParts[1], hashParts[0]);
			}
		} else {
			changeTitle();
			showArtists();
		}
	};

	const changeTitle = (value = '') => {
		title.innerHTML = '<a href="#">Library</a>' + value;
		title.parentNode.scrollLeft = title.parentNode.scrollWidth;
	};

	const showArtists = () => {
		browser.innerHTML = '';
		library.artists.forEach(function(item) {
			const paneElement = pane.cloneNode(true);
			const titleElement = paneElement.querySelector('.pane__title');
			const imageElement = paneElement.querySelector('.pane__image');
			paneElement.classList.add('pane--artist');
			titleElement.textContent = item.name;
			imageElement.style.backgroundImage = `url("${item.cover || ''}")`;
			browser.appendChild(paneElement);

			paneElement.dataset.uid = item.uid;
			paneElement.dataset.type = 'artist';
			paneElement.dataset.title = item.name;
		});
	};

	const showAlbums = (artist_id) => {
		browser.innerHTML = '';

		let albums = library.albums.filter(item => {
			return item.artist == artist_id || item.artist_id == artist_id;
		});

		albums = albums.sort((a, b) => b.date - a.date);

		albums.forEach(function(item) {
			const paneElement = pane.cloneNode(true);
			const titleElement = paneElement.querySelector('.pane__title');
			const imageElement = paneElement.querySelector('.pane__image');
			paneElement.classList.add('pane--album');
			titleElement.textContent = item.title + ' - ' + item.date;
			imageElement.style.backgroundImage = `url("${item.cover || ''}")`;

			browser.appendChild(paneElement);

			paneElement.dataset.uid = item.uid;
			paneElement.dataset.type = 'album';
			paneElement.dataset.title = item.title;
		});
	};

	const showSongs = (album_id, artist_id = false) => {
		browser.innerHTML = '';

		let songs = library.songs.filter(item => {
			if (artist_id) {
				return (item.album == album_id || item.album_id == album_id) && item.artist == artist_id;
			} else {
				return item.album == album_id || item.album_id == album_id;
			}
		});

		songs = songs.sort((a, b) => a.track - b.track);

		songs.forEach(function(item) {
			const listElement = listItem.cloneNode(true);
			const trackElement = listElement.querySelector('.item__track');
			const titleElement = listElement.querySelector('.item__title');
			const lengthElement = listElement.querySelector('.item__length');
			listElement.classList.add('item--song');
			trackElement.textContent = item.track;
			titleElement.textContent = item.title;
			lengthElement.textContent = item.length;

			browser.appendChild(listElement);

			if (current_song && item.uid == current_song.uid) {
				listElement.classList.add('is-playing');
			}

			listElement.dataset.uid = item.uid;
			listElement.dataset.type = 'song';
		});
	};

	getLibrary();

	const clickHandler = (event) => {
		const path = event.path || getPath(event.target);
		let pane = path.filter(item => item.classList && item.classList.contains('pane'));

		if (pane.length > 0) {
			pane = pane[0];
			let hashParts = window.location.hash.split('/');

			while (hashParts[0] == '') {
				hashParts.shift();
			}

			hashParts.push(encodeURI(pane.dataset.title));
			window.location.hash = hashParts.join('/');
		} else {
			let songElement = path.filter(item => item.classList && item.classList.contains('item--song'));

			if (songElement.length > 0) {
				songElement = songElement[0];

				const song = library.songs.filter(item => {
					return item.uid == songElement.dataset.uid;
				})[0];

				selectItem(songElement);
			} else {
				selectItem();
			}
		}
	};

	const dblClickHandler = (event) => {
		const path = event.path || getPath(event.target);
		let songElement = path.filter(item => item.classList && item.classList.contains('item--song'));

		if (songElement.length > 0) {
			songElement = songElement[0];

			const song = library.songs.filter(item => {
				return item.uid == songElement.dataset.uid;
			})[0];

			!shuffle && (current_track_number = nodeIndex(songElement));

			skipToSong(song, true);
		}
	};

	const dblTouchHandler = (event) => {
		const path = event.path || getPath(event.target);
		let songElement = path.filter(item => item.classList && item.classList.contains('item--song'));

		if (songElement.length > 0) {
			songElement = songElement[0];

			const song = library.songs.filter(item => {
				return item.uid == songElement.dataset.uid;
			})[0];

			if (songElement.classList.contains('is-selected')) {
				skipToSong(song, true);
			}
		}
	};

	browser.addEventListener('click', clickHandler);
	browser.addEventListener('touchstart', dblTouchHandler);
	browser.addEventListener('dblclick', dblClickHandler);

	const getPath = (node) => {
		let path = [];

		while (node != document.body) {
			path.push(node);
			node = node.parentNode;
		}

		return path;
	};

	//

	player_minimizer.addEventListener('click', () => {
		main.classList.toggle('is-minimized');
	});

	const button_play = document.querySelector('.button--play');
	const button_prev = document.querySelector('.button--prev');
	const button_next = document.querySelector('.button--next');

	const button_shuffle = document.querySelector('.button--shuffle');
	const button_volume = document.querySelector('.button--volume');
	const volume_slider = document.querySelector('.volume-slider');

	volume_slider.addEventListener('input', event => {
		audio.volume = event.target.value * .01;

		event.target.parentNode.parentNode.classList.remove('is-muted');
		event.target.parentNode.parentNode.classList.remove('is-loud');

		if (event.target.value == 0) {
			event.target.parentNode.parentNode.classList.add('is-muted');
		} else if (event.target.value > 50) {
			event.target.parentNode.parentNode.classList.add('is-loud');
		}
	});

	button_play.addEventListener('click', () => {
		if (audio.paused) {
			//track.textContent = `${current_song.artist} - ${current_song.title}`;
			audio.play();
		} else {
			//track.textContent = `(paused) ${current_song.artist} - ${current_song.title}`;
			audio.pause();
		}
	});

	button_next.addEventListener('click', () => {
		const list = (shuffle? queue_shuffled : queue);

		if (current_track_number < list.length - 1) {
			current_track_number++;
			skipToSong(list[current_track_number], !audio.paused);
		}
	});

	button_prev.addEventListener('click', () => {
		const list = (shuffle? queue_shuffled : queue);

		if (current_track_number > 0) {
			current_track_number--;
			skipToSong(list[current_track_number], !audio.paused);
		}
	});

	info_seekbar.addEventListener('mousedown', (event) => {
		//clearTimeout(timer);
		!audio.paused && main.classList.add('is-seeking');
		//!audio.paused && (audio.pause() && clearTimeout(timer));
	});

	info_seekbar.addEventListener('input', event => {
		if (main.classList.contains('is-seeking')) {
			const newTime = parseInt((info_seekbar.value / info_seekbar.max) * audio.duration);

			let currentSeconds = parseInt(newTime) % 60;
			currentSeconds = (currentSeconds < 10)? '0' + currentSeconds : currentSeconds;
			const currentMinutes = parseInt(newTime / 60);

			info_time_elapsed.textContent = `${currentMinutes}:${currentSeconds}`;
		}
	});


	info_seekbar.addEventListener('touchstart', (event) => {
		//clearTimeout(timer);
		!audio.paused && main.classList.add('is-seeking');
		//!audio.paused && (audio.pause() && clearTimeout(timer));
	});

	info_seekbar.addEventListener('change', (event) => {
		!audio.paused && (audio.pause() && clearTimeout(timer));
		audio.currentTime = parseInt((info_seekbar.value / info_seekbar.max) * audio.duration);

		if (main.classList.contains('is-seeking')) {
			main.classList.remove('is-seeking');
			audio.play();
		} else {
			//updateTime();
		}
	});

	button_shuffle.addEventListener('click', (event) => {
		shuffle = !shuffle;
		button_shuffle.classList.toggle('is-active');

		if (shuffle) {
			current_track_number = 0;
			queue_shuffled = shuffleArray(queue.filter(item => {
				return item.uid !== current_song.uid;
			}));
			queue_shuffled.unshift(current_song);

			button_next.disabled = false;
			button_prev.disabled = true;
		} else {
			current_track_number = queue.indexOf(current_song);

			if (current_track_number >= queue.length - 1) {
				button_next.disabled = true;
			} else {
				button_next.disabled = false;
			}

			if (current_track_number == 0) {
				button_prev.disabled = true;
			} else {
				button_prev.disabled = false;
			}
		}
	});

	const shuffleArray = (array) => {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
	};

	const nodeIndex = (node) => {
    var index = 0;
		while ( (node = node.previousElementSibling) ) {
			index++;
		}
		return index;
	};
})();
