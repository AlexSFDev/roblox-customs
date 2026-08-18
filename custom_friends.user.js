// ==UserScript==
// @name         Roblox Custom Friends
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @match        https://www.roblox.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function(){
	'use strict';

	const FRIENDS=[
		"KreekCraft",
		"TanqR",
		"mrflimflam",
		"TheRealShowspeedy",
		"ReallyCruz",
		"SharkBlox",
    "Stickmasterluke",
		"ImNotThinknoodles",
		"indiieun"
	];

	const users=new Map();

	/*
	 * Roblox presence types:
	 *
	 * 3 = Studio
	 * 2 = In Experience
	 * 1 = Online
	 * 0 = Offline
	 *
	 * Desired overall order:
	 *
	 * Studio
	 * In Game
	 * Online
	 * Offline
	 *
	 * Within EACH group:
	 *
	 * Verified fake friends
	 * Unverified fake friends
	 * Real friends
	 */

	const priority={
		3:4,
		2:3,
		1:2,
		0:1
	};

	const $=(s,e=document)=>e.querySelector(s);

	let resolving=false;
	let presenceUpdating=false;
	let rendering=false;
	let started=false;
	let verifiedUpdating=false;

	let presenceTimer=null;
	let renderTimer=null;

	let realFriendCount=null;

	let suppressMutations=false;

	let friendsContainer=null;
	let friendsParent=null;

	let containerObserver=null;
	let parentObserver=null;

	let activePopup=null;
	let activePopupUser=null;
	let popupHideTimer=null;
	let popupRequestId=0;

	function styles(){

		if($('#custom-friends-styles'))
			return;

		const s=document.createElement('style');

		s.id='custom-friends-styles';

		s.textContent=`

.custom-friend-wrapper{
	flex:0 0 auto!important;
	display:block!important;
	position:relative!important;
}

.custom-friend-wrapper .friends-carousel-tile{
	background:transparent!important;
}

.custom-friend-wrapper .custom-friend-button{
	background:transparent!important;
	border:0!important;
	padding:0!important;
	cursor:pointer!important;
}

.custom-friend-wrapper .avatar-card-fullbody{
	position:relative!important;
	overflow:visible!important;
}

.custom-friend-wrapper .avatar-card-image{
	overflow:hidden!important;
}

.custom-friend-wrapper .custom-friend-avatar{
	display:block!important;
	width:100%!important;
	height:100%!important;
	object-fit:cover!important;
	border-radius:50%!important;
}

.custom-friend-wrapper .avatar-status{
	position:absolute!important;
	right:0!important;
	bottom:0!important;
	z-index:10!important;
}

.custom-friend-wrapper .friends-carousel-tile-labels{
	position:relative!important;
	z-index:5!important;
}

.custom-friend-wrapper .friends-carousel-tile-name{
	display:flex!important;
	align-items:center!important;
	width:100%!important;
}

.custom-friend-wrapper .custom-local-verified-badge{
	display:inline-flex!important;
	align-items:center!important;
	justify-content:center!important;

	flex:0 0 auto!important;

	width:var(--icon-size-large)!important;
	height:var(--icon-size-large)!important;

	margin-left:-2px!important;
	margin-right:0!important;
	padding:0!important;

	position:relative!important;
	vertical-align:middle!important;

	transform:scale(.75)!important;
	transform-origin:center center!important;

	z-index:10!important;

	line-height:0!important;

	pointer-events:none!important;
}

.custom-friend-wrapper .custom-local-verified-badge .icon{
	flex-shrink:0!important;
}


/*
 * =========================================================
 * FAKE FRIEND HOVER POPUP
 * =========================================================
 */

.custom-friend-hover-anchor{
	position:relative!important;
}

.custom-friend-hover-popup{
	position:fixed!important;
	width:260px!important;
	z-index:1050!important;

	pointer-events:auto!important;

	opacity:0;
	visibility:hidden;
	transform:translateY(4px);

	transition:
		opacity .12s ease,
		transform .12s ease,
		visibility .12s ease;

	box-sizing:border-box!important;
}

.custom-friend-hover-popup.visible{
	opacity:1!important;
	visibility:visible!important;
	transform:translateY(0)!important;
}

.custom-friend-hover-popup-inner{
	width:260px!important;
}

.custom-friend-hover-popup .friend-tile-dropdown{
	background-color:transparent!important;
	border-radius:0!important;
	width:100%!important;
}

.custom-friend-hover-popup .in-game-friend-card--iarc{
	box-sizing:border-box!important;

	background-color:var(--color-background-over-media-300,rgba(24,24,27,.96))!important;

	border-radius:var(--radius-medium,8px)!important;

	padding-top:var(--spacing-large,16px)!important;
	padding-bottom:var(--spacing-large,16px)!important;
	padding-left:var(--spacing-large,16px)!important;
	padding-right:var(--spacing-large,16px)!important;

	display:flex!important;
	flex-direction:column!important;
	align-items:flex-start!important;
	justify-content:center!important;

	gap:var(--spacing-medium,12px)!important;

	width:100%!important;

	box-shadow:
		0 8px 30px rgba(0,0,0,.35),
		0 2px 8px rgba(0,0,0,.2)!important;

	border:1px solid rgba(255,255,255,.08)!important;
}

.custom-friend-hover-popup .custom-friend-game-link{
	display:flex!important;
	align-items:center!important;
	gap:var(--spacing-small,8px)!important;

	width:100%!important;
	min-width:0!important;

	color:inherit!important;
	text-decoration:none!important;
}

.custom-friend-hover-popup .custom-friend-game-icon{
	flex-shrink:0!important;

	width:40px!important;
	height:40px!important;

	display:inline-block!important;

	border-radius:var(--radius-small,4px)!important;

	overflow:hidden!important;
}

.custom-friend-hover-popup .custom-friend-game-icon img{
	display:block!important;

	width:40px!important;
	height:40px!important;

	object-fit:cover!important;
}

.custom-friend-hover-popup .friend-presence-info{
	display:flex!important;
	flex-direction:column!important;
	justify-content:center!important;

	min-width:0!important;
	flex:1!important;
}

.custom-friend-hover-popup .friend-tile-is-playing{
	font-size:14px!important;
	line-height:20px!important;

	color:var(--color-content-default,#e5e7eb)!important;

	white-space:nowrap!important;
	overflow:hidden!important;
	text-overflow:ellipsis!important;
}

.custom-friend-hover-popup .friend-tile-game-name{
	font-size:16px!important;
	line-height:22px!important;
	font-weight:600!important;

	color:var(--color-content-emphasis,#fff)!important;

	white-space:nowrap!important;
	overflow:hidden!important;
	text-overflow:ellipsis!important;
}

.custom-friend-hover-popup .in-game-friend-card-actions{
	display:flex!important;
	flex-direction:column!important;

	align-self:stretch!important;

	gap:var(--spacing-small,8px)!important;
}

.custom-friend-hover-popup .custom-friend-popup-button{
	position:relative!important;

	display:flex!important;
	align-items:center!important;
	justify-content:center!important;

	width:100%!important;

	min-height:40px!important;

	border:0!important;
	border-radius:6px!important;

	padding:0 14px!important;

	cursor:pointer!important;

	font-size:14px!important;
	font-weight:500!important;

	box-sizing:border-box!important;
}

.custom-friend-hover-popup .custom-friend-popup-button.join{
	background:var(--color-action-emphasis,#00a2ff)!important;
	color:#fff!important;
}

.custom-friend-hover-popup .custom-friend-popup-button.chat{
	background:rgba(255,255,255,.08)!important;
	color:#fff!important;
}

.custom-friend-hover-popup .custom-friend-popup-button:hover{
	filter:brightness(1.08)!important;
}

.custom-friend-hover-popup .custom-friend-profile-link{
	display:flex!important;
	align-items:center!important;
	justify-content:center!important;

	align-self:stretch!important;

	height:32px!important;

	color:var(--color-content-action-standard,#fff)!important;

	text-decoration:none!important;

	font-size:14px!important;
	font-weight:500!important;

	border-radius:4px!important;
}

.custom-friend-hover-popup .custom-friend-profile-link:hover{
	background:rgba(255,255,255,.06)!important;
}

.custom-friends-add-tile{
	display:block!important;
	flex:0 0 auto!important;
}

`;

		document.head.appendChild(s);
	}

	function container(){

		if(
			friendsContainer&&
			document.contains(friendsContainer)
		){
			return friendsContainer;
		}

		friendsContainer=
			$('.friends-carousel-list-container');

		return friendsContainer;
	}

	function getCounter(){
		return $('.friends-count');
	}

	function captureRealFriendCount(){

		const counter=getCounter();

		if(!counter)
			return;

		if(realFriendCount!==null)
			return;

		const text=
			counter.textContent||'';

		const match=
			text.match(/\d+/);

		if(!match)
			return;

		const number=
			parseInt(
				match[0],
				10
			);

		if(Number.isFinite(number))
			realFriendCount=number;
	}

	function updateCounter(){

		const counter=getCounter();

		if(!counter)
			return;

		captureRealFriendCount();

		if(realFriendCount===null)
			return;

		const total=
			realFriendCount+
			users.size;

		const value=
			`(${total})`;

		if(counter.textContent!==value)
			counter.textContent=value;
	}

	async function resolve(){

		if(resolving)
			return;

		const missing=
			FRIENDS.filter(
				name=>
					!users.has(
						name.toLowerCase()
					)
			);

		if(!missing.length)
			return;

		resolving=true;

		try{

			const r=
				await fetch(
					'https://users.roblox.com/v1/usernames/users',
					{
						method:'POST',
						credentials:'include',
						headers:{
							'Content-Type':
								'application/json'
						},
						body:JSON.stringify({
							usernames:missing,
							excludeBannedUsers:false
						})
					}
				);

			if(!r.ok)
				return;

			const d=
				await r.json();

			for(
				const u of d.data||[]
			){

				users.set(
					u.name.toLowerCase(),
					{
						id:u.id,
						username:u.name,
						displayName:
							u.displayName||
							u.name,

						presenceType:0,
						location:'',

						avatar:'',
						verified:false,

						/*
						 * Game/presence information
						 */
						placeId:null,
						rootPlaceId:null,
						gameId:null,
						universeId:null,
						gameName:'',
						gameIcon:''
					}
				);
			}

		}
		catch(e){

			console.error(
				'[Custom Friends] Resolve error',
				e
			);

		}
		finally{

			resolving=false;
		}
	}

	/*
	 * =========================================================
	 * VERIFIED BADGES
	 * =========================================================
	 */

	async function loadVerifiedBadges(){

		if(
			verifiedUpdating||
			!users.size
		)
			return;

		verifiedUpdating=true;

		try{

			const ids=
				[...users.values()]
					.map(
						u=>u.id
					);

			const r=
				await fetch(
					'https://users.roblox.com/v1/users',
					{
						method:'POST',
						credentials:'include',
						headers:{
							'Content-Type':
								'application/json'
						},
						body:JSON.stringify({
							userIds:ids
						})
					}
				);

			if(!r.ok){

				console.error(
					'[Custom Friends] Verified API failed:',
					r.status,
					r.statusText
				);

				return;
			}

			const d=
				await r.json();

			const usersById=
				new Map(
					[...users.values()]
						.map(
							u=>[
								String(u.id),
								u
							]
						)
				);

			for(
				const apiUser of d.data||[]
			){

				const user=
					usersById.get(
						String(apiUser.id)
					);

				if(!user)
					continue;

				user.verified=
					apiUser.hasVerifiedBadge===true;

			}

		}
		catch(e){

			console.error(
				'[Custom Friends] Verified badge error',
				e
			);

		}
		finally{

			verifiedUpdating=false;
		}
	}

	function createVerifiedBadge(){

		const badge=
			document.createElement('span');

		badge.className=
			'custom-local-verified-badge';

		badge.setAttribute(
			'aria-label',
			'Verified'
		);

		badge.setAttribute(
			'role',
			'img'
		);

		badge.innerHTML=`

<span
	aria-hidden="true"
	data-testid="foundation-web-icon"
	class="grow-0 shrink-0 basis-auto icon icon-filled-verified-backplate size-[var(--icon-size-large)] content-system-emphasis">
</span>

<span
	aria-hidden="true"
	data-testid="foundation-web-icon"
	class="grow-0 shrink-0 basis-auto icon icon-filled-verified-check size-[var(--icon-size-large)] absolute"
	style="color:white;">
</span>

`;

		return badge;
	}

	function updateVerifiedBadge(w,user){

		if(!w||!user)
			return;

		const name=
			$('.friends-carousel-display-name',w);

		if(!name)
			return;

		const existing=
			$('.custom-local-verified-badge',w);

		if(!user.verified){

			if(existing)
				existing.remove();

			return;
		}

		if(existing)
			return;

		const badge=
			createVerifiedBadge();

		name.insertAdjacentElement(
			'afterend',
			badge
		);
	}

	/*
	 * =========================================================
	 * GAME INFORMATION
	 * =========================================================
	 */

	async function loadGameInformation(user){

		if(
			!user||
			user.presenceType!==2||
			!user.universeId
		)
			return;

		try{

			const universeId=
				String(user.universeId);

			const gameResponse=
				await fetch(
					`https://games.roblox.com/v1/games?universeIds=${encodeURIComponent(universeId)}`,
					{
						credentials:'include'
					}
				);

			if(gameResponse.ok){

				const gameData=
					await gameResponse.json();

				const game=
					(gameData.data||[])[0];

				if(game){

					user.gameName=
						game.name||
						user.location||
						'Unknown Experience';

				}
			}

			const iconResponse=
				await fetch(
					`https://thumbnails.roblox.com/v1/games/icons?universeIds=${encodeURIComponent(universeId)}&size=150x150&format=Png&isCircular=false`,
					{
						credentials:'include'
					}
				);

			if(iconResponse.ok){

				const iconData=
					await iconResponse.json();

				const icon=
					(iconData.data||[])[0];

				if(icon&&icon.imageUrl){

					user.gameIcon=
						icon.imageUrl;

				}
			}

		}
		catch(e){

			console.error(
				'[Custom Friends] Game information error',
				e
			);
		}
	}

	/*
	 * =========================================================
	 * HOVER POPUP
	 * =========================================================
	 */

	function cancelPopupHide(){

		if(popupHideTimer){

			clearTimeout(
				popupHideTimer
			);

			popupHideTimer=null;
		}
	}

	function schedulePopupHide(){

		cancelPopupHide();

		popupHideTimer=
			setTimeout(
				()=>{
					hideFriendPopup();
				},
				120
			);
	}

	function hideFriendPopup(){

		cancelPopupHide();

		popupRequestId++;

		if(activePopup){

			activePopup.classList.remove(
				'visible'
			);

			activePopup=
				null;

			activePopupUser=
				null;
		}
	}

	function positionFriendPopup(w,popup){

		if(!w||!popup)
			return;

		const anchor=
			$('.friends-carousel-tile',w)||w;

		const rect=
			anchor.getBoundingClientRect();

		const popupWidth=260;
		const gap=8;

		let left=
			rect.left+
			(rect.width-popupWidth)/2;

		let top=
			rect.bottom+
			gap;

		const viewportPadding=8;

		if(
			left+popupWidth>
			window.innerWidth-viewportPadding
		){

			left=
				window.innerWidth-
				popupWidth-
				viewportPadding;
		}

		if(left<viewportPadding)
			left=viewportPadding;

		const popupHeight=
			popup.offsetHeight||
			250;

		if(
			top+popupHeight>
			window.innerHeight-viewportPadding
		){

			top=
				rect.top-
				popupHeight-
				gap;
		}

		if(top<viewportPadding)
			top=viewportPadding;

		popup.style.left=
			`${Math.round(left)}px`;

		popup.style.top=
			`${Math.round(top)}px`;
	}

	function createFriendPopup(user){

		const popup=
			document.createElement('div');

		popup.className=
			'custom-friend-hover-popup';

		popup.innerHTML=`

<div class="custom-friend-hover-popup-inner">

	<div class="friend-tile-dropdown friend-tile-dropdown--iarc">

		<div class="in-game-friend-card--iarc">

			<a
				class="custom-friend-game-link"
				href="https://www.roblox.com/games/${user.rootPlaceId||user.placeId||''}"
				target="_self"
			>

				<span class="custom-friend-game-icon">

					<img
						alt=""
						class="custom-friend-game-image"
					>

				</span>

				<span class="friend-presence-info">

					<span class="friend-tile-is-playing">
						${escapeHtml(user.username)} is playing
					</span>

					<span class="friend-tile-game-name">
						${escapeHtml(
							user.gameName||
							user.location||
							'Unknown Experience'
						)}
					</span>

				</span>

			</a>

			<div class="in-game-friend-card-actions">

				<button
					type="button"
					class="custom-friend-popup-button join"
				>
					Join
				</button>

				<button
					type="button"
					class="custom-friend-popup-button chat"
				>
					Chat
				</button>

				<a
					class="custom-friend-profile-link"
					href="/users/${user.id}/profile"
				>
					View Profile
				</a>

			</div>

		</div>

	</div>

</div>

`;

		const image=
			$('.custom-friend-game-image',popup);

		if(image){

			image.src=
				user.gameIcon||
				'';

		}

		const joinButton=
			$('.custom-friend-popup-button.join',popup);

		if(joinButton){

			joinButton.addEventListener(
				'click',
				event=>{

					event.preventDefault();
					event.stopPropagation();

					const placeId=
						user.rootPlaceId||
						user.placeId;

					if(!placeId)
						return;

					window.location.href=
						`https://www.roblox.com/games/${placeId}`;

				}
			);

		}

		const chatButton=
			$('.custom-friend-popup-button.chat',popup);

		if(chatButton){

			chatButton.addEventListener(
				'click',
				event=>{

					event.preventDefault();
					event.stopPropagation();

					/*
					 * Roblox handles messaging through its
					 * own UI. Open the user's profile so the
					 * normal Roblox chat/message controls can
					 * be used.
					 */

					window.location.href=
						`/users/${user.id}/profile`;

				}
			);

		}

		popup.addEventListener(
			'mouseenter',
			()=>{
				cancelPopupHide();
			}
		);

		popup.addEventListener(
			'mouseleave',
			()=>{
				schedulePopupHide();
			}
		);

		document.body.appendChild(
			popup
		);

		return popup;
	}

	function escapeHtml(value){

		return String(value||'')
			.replace(
				/&/g,
				'&amp;'
			)
			.replace(
				/</g,
				'&lt;'
			)
			.replace(
				/>/g,
				'&gt;'
			)
			.replace(
				/"/g,
				'&quot;'
			)
			.replace(
				/'/g,
				'&#039;'
			);
	}

	async function showFriendPopup(w,user){

		if(
			!w||
			!user||
			user.presenceType!==2
		)
			return;

		cancelPopupHide();

		const requestId=
			++popupRequestId;

		if(activePopup)
			hideFriendPopup();

		activePopupUser=
			user;

		/*
		 * Load game data before displaying the card.
		 */
		await loadGameInformation(user);

		if(
			requestId!==popupRequestId
		)
			return;

		if(
			activePopupUser!==user
		)
			return;

		const popup=
			createFriendPopup(user);

		activePopup=
			popup;

		positionFriendPopup(
			w,
			popup
		);

		requestAnimationFrame(
			()=>{
				if(
					activePopup===popup
				){

					positionFriendPopup(
						w,
						popup
					);

					popup.classList.add(
						'visible'
					);
				}
			}
		);
	}

	function setupFriendHover(w,user){

		if(
			!w||
			w.dataset.hoverBound==='1'
		)
			return;

		w.dataset.hoverBound='1';

		const anchor=
			$('.friends-carousel-tile',w)||w;

		anchor.addEventListener(
			'mouseenter',
			()=>{

				cancelPopupHide();

				showFriendPopup(
					w,
					user
				);

			}
		);

		anchor.addEventListener(
			'mouseleave',
			()=>{

				schedulePopupHide();

			}
		);

	}

	/*
	 * Keep popup positioned correctly while scrolling/resizing.
	 */

	window.addEventListener(
		'scroll',
		()=>{

			if(
				activePopup&&
				activePopupUser
			){

				const w=
					container()&&
					container().querySelector(
						`.custom-friend-wrapper[data-user-id="${activePopupUser.id}"]`
					);

				if(w){

					positionFriendPopup(
						w,
						activePopup
					);

				}
			}

		},
		{
			passive:true
		}
	);

	window.addEventListener(
		'resize',
		()=>{

			if(
				activePopup&&
				activePopupUser
			){

				const w=
					container()&&
					container().querySelector(
						`.custom-friend-wrapper[data-user-id="${activePopupUser.id}"]`
					);

				if(w){

					positionFriendPopup(
						w,
						activePopup
					);

				}
			}

		}
	);

	function isAdd(el){

		return !!el&&
			!el.classList.contains(
				'custom-friend-wrapper'
			)&&
			(el.textContent||'')
				.toLowerCase()
				.includes('add friends');
	}

	function isRealFriend(el){

		return !!el&&
			!el.classList.contains(
				'custom-friend-wrapper'
			)&&
			!isAdd(el);
	}

	function create(user){

		const w=
			document.createElement('div');

		w.className=
			'custom-friend-wrapper';

		w.dataset.userId=
			String(user.id);

		w.innerHTML=`

<div class="friends-carousel-tile">

	<div>

		<button
			type="button"
			class="options-dropdown custom-friend-button"
		>

			<div class="friend-tile-content">

				<div
					class="avatar avatar-card-fullbody"
					data-testid="avatar-card-container"
				>

					<a
						href="/users/${user.id}/profile"
						class="avatar-card-link"
					>

						<span
							class="thumbnail-2d-container avatar-card-image"
						>

							<img
								class="custom-friend-avatar"
								alt="${escapeHtml(user.displayName)}"
							>

						</span>

					</a>

					<div class="avatar-status"></div>

				</div>

				<a
					href="/users/${user.id}/profile"
					class="friends-carousel-tile-labels"
				>

					<div class="friends-carousel-tile-label">

						<div class="friends-carousel-tile-name">

							<span
								class="friends-carousel-display-name"
							>
								${escapeHtml(user.displayName)}
							</span>

						</div>

					</div>

					<div class="friends-carousel-tile-sublabel">

						<div
							class="friends-carousel-tile-experience custom-friend-game"
						></div>

					</div>

				</a>

			</div>

		</button>

	</div>

</div>

`;

		setupFriendHover(
			w,
			user
		);

		return w;
	}

	async function loadAvatars(){

		const list=[
			...users.values()
		];

		if(!list.length)
			return;

		try{

			const r=
				await fetch(
					`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${list.map(u=>u.id).join(',')}&size=150x150&format=Png&isCircular=false`
				);

			if(!r.ok)
				return;

			const d=
				await r.json();

			const c=
				container();

			if(!c)
				return;

			const usersById=
				new Map(
					[...users.values()]
						.map(
							u=>[
								String(u.id),
								u
							]
						)
				);

			for(
				const item of d.data||[]
			){

				const user=
					usersById.get(
						String(item.targetId)
					);

				if(
					!user||
					!item.imageUrl
				)
					continue;

				user.avatar=
					item.imageUrl;

				const w=
					c.querySelector(
						`.custom-friend-wrapper[data-user-id="${item.targetId}"]`
					);

				const img=
					w&&
					$('.custom-friend-avatar',w);

				if(img)
					img.src=
						item.imageUrl;
			}

		}
		catch(e){

			console.error(
				'[Custom Friends] Avatar error',
				e
			);
		}
	}

	function updateUserPresence(p){

		const user=
			[...users.values()]
				.find(
					u=>
						String(u.id)===
						String(p.userId)
				);

		if(!user)
			return false;

		const newPresence=
			Number(
				p.userPresenceType||0
			);

		const newLocation=
			p.lastLocation||'';

		const changed=
			user.presenceType!==newPresence||
			user.location!==newLocation||
			user.placeId!==
				(p.placeId||null)||
			user.rootPlaceId!==
				(p.rootPlaceId||null)||
			user.gameId!==
				(p.gameId||null)||
			user.universeId!==
				(p.universeId||null);

		user.presenceType=
			newPresence;

		user.location=
			newLocation;

		user.placeId=
			p.placeId||
			null;

		user.rootPlaceId=
			p.rootPlaceId||
			null;

		user.gameId=
			p.gameId||
			null;

		user.universeId=
			p.universeId||
			null;

		/*
		 * Game information belongs to the current
		 * experience, so invalidate it when the
		 * experience changes.
		 */
		if(
			newPresence!==2
		){

			user.gameName='';
			user.gameIcon='';

		}

		const c=
			container();

		if(!c)
			return changed;

		const w=
			c.querySelector(
				`.custom-friend-wrapper[data-user-id="${p.userId}"]`
			);

		if(!w)
			return changed;

		const status=
			$('.avatar-status',w);

		const game=
			$('.custom-friend-game',w);

		if(!status||!game)
			return changed;

		if(!changed)
			return false;

		status.innerHTML='';
		game.textContent='';

		if(
			user.presenceType===3
		){

			status.innerHTML=`
<span
	data-testid="presence-icon"
	title="Studio"
	class="studio icon-studio"
></span>
`;

			game.textContent=
				'Studio';
		}

		else if(
			user.presenceType===2
		){

			status.innerHTML=`
<span
	data-testid="presence-icon"
	title="${escapeHtml(user.location||'Playing')}"
	class="game icon-game"
></span>
`;

			game.textContent=
				user.location||
				'Playing';
		}

		else if(
			user.presenceType===1
		){

			status.innerHTML=`
<span
	data-testid="presence-icon"
	title="Online"
	class="online icon-online"
></span>
`;

			game.textContent=
				'Online';
		}

		else{

			status.innerHTML='';
			game.textContent='';
		}

		return changed;
	}

	async function updatePresence(){

		if(
			presenceUpdating||
			!users.size
		)
			return false;

		presenceUpdating=true;

		let changed=false;

		try{

			const r=
				await fetch(
					'https://presence.roblox.com/v1/presence/users',
					{
						method:'POST',
						credentials:'include',
						headers:{
							'Content-Type':
								'application/json'
						},
						body:JSON.stringify({
							userIds:[
								...users.values()
							].map(
								u=>u.id
							)
						})
					}
				);

			if(!r.ok)
				return false;

			const d=
				await r.json();

			for(
				const p of
					d.userPresences||
					[]
			){

				if(
					updateUserPresence(p)
				){
					changed=true;
				}
			}

		}
		catch(e){

			console.error(
				'[Custom Friends] Presence error',
				e
			);

		}
		finally{

			presenceUpdating=false;
		}

		return changed;
	}

	function getRealFriendPresence(el){

		if(!el)
			return 0;

		if(
			el.querySelector(
				'.icon-studio'
			)
		){
			return 3;
		}

		if(
			el.querySelector(
				'.icon-game'
			)
		){
			return 2;
		}

		if(
			el.querySelector(
				'.icon-online'
			)
		){
			return 1;
		}

		return 0;
	}

	function sorted(){

		return[
			...users.values()
		].sort(
			(a,b)=>{

				const pa=
					priority[
						a.presenceType
					]||1;

				const pb=
					priority[
						b.presenceType
					]||1;

				if(pa!==pb){
					return pb-pa;
				}

				/*
				 * Verified fake friends first
				 * within each presence group.
				 */
				if(a.verified!==b.verified){
					return a.verified ? -1 : 1;
				}

				return 0;
			}
		);
	}

	function getExistingCustom(c){

		return new Map(
			[...c.children]
				.filter(
					x=>
						x.classList.contains(
							'custom-friend-wrapper'
						)
				)
				.map(
					w=>[
						String(
							w.dataset.userId
						),
						w
					]
				)
		);
	}

	function reconcileOrder(c,desired){

		let current=
			c.firstElementChild;

		for(
			let i=0;
			i<desired.length;
			i++
		){

			const wanted=
				desired[i];

			if(
				current===
				wanted
			){

				current=
					current.nextElementSibling;

				continue;
			}

			c.insertBefore(
				wanted,
				current
			);

			current=
				wanted.nextElementSibling;
		}
	}

	function applyVisualOrder(
		add,
		customElements,
		realFriends
	){

		if(add){

			add.style.order=
				'0';
		}

		const groups={
			3:{
				fake:[],
				real:[]
			},
			2:{
				fake:[],
				real:[]
			},
			1:{
				fake:[],
				real:[]
			},
			0:{
				fake:[],
				real:[]
			}
		};

		for(
			const w of customElements
		){

			const user=
				[...users.values()]
					.find(
						u=>
							String(u.id)===
							String(
								w.dataset.userId
							)
					);

			if(!user)
				continue;

			const presence=
				priority[
					user.presenceType
				]?
					user.presenceType:
					0;

			groups[presence].fake.push(w);
		}

		for(
			const real of realFriends
		){

			const presence=
				getRealFriendPresence(real);

			groups[presence].real.push(real);
		}

		const presenceGroups=[
			3,
			2,
			1,
			0
		];

		let baseOrder=10;

		for(
			const presence of presenceGroups
		){

			const group=
				groups[presence];

			/*
			 * sorted() already puts verified users
			 * before unverified users, so the DOM
			 * order here preserves that ordering.
			 */
			for(
				let i=0;
				i<group.fake.length;
				i++
			){

				group.fake[i].style.order=
					String(
						baseOrder+i
					);
			}

			const realBase=
				baseOrder+
				group.fake.length;

			for(
				let i=0;
				i<group.real.length;
				i++
			){

				group.real[i].style.order=
					String(
						realBase+i
					);
			}

			baseOrder+=100;
		}
	}

	function render(){

		const c=
			container();

		if(
			!c||
			rendering
		)
			return;

		rendering=true;
		suppressMutations=true;

		try{

			captureRealFriendCount();

			let add=
				[...c.children]
					.find(isAdd);

			if(add){

				add.classList.add(
					'custom-friends-add-tile'
				);
			}

			const existing=
				getExistingCustom(c);

			const ordered=
				sorted();

			const customElements=[];

			for(
				const user of ordered
			){

				let w=
					existing.get(
						String(user.id)
					);

				if(!w){

					w=create(user);

					if(user.avatar){

						const img=
							$('.custom-friend-avatar',w);

						if(img)
							img.src=
								user.avatar;
					}
				}

				/*
				 * Ensure hover remains bound even if
				 * the element was created previously.
				 */
				setupFriendHover(
					w,
					user
				);

				if(
					w.style.display!==
					'block'
				){

					w.style.display=
						'block';
				}

				updateVerifiedBadge(
					w,
					user
				);

				customElements.push(w);
			}

			for(
				const w of existing.values()
			){

				if(
					!customElements.includes(w)
				){

					w.remove();
				}
			}

			const realFriends=
				[...c.children]
					.filter(isRealFriend);

			const realGroups={
				3:[],
				2:[],
				1:[],
				0:[]
			};

			for(
				const real of realFriends
			){

				const presence=
					getRealFriendPresence(real);

				realGroups[presence].push(real);
			}

			const desired=[];

			if(add)
				desired.push(add);

			for(
				const presence of [3,2,1,0]
			){

				for(
					const user of ordered
				){

					if(
						user.presenceType!==
						presence
					)
						continue;

					const w=
						customElements.find(
							el=>
								String(
									el.dataset.userId
								)===
								String(user.id)
						);

					if(w)
						desired.push(w);
				}

				for(
					const real of
						realGroups[presence]
				){

					desired.push(real);
				}
			}

			reconcileOrder(
				c,
				desired
			);

			applyVisualOrder(
				add,
				customElements,
				realFriends
			);

			updateCounter();

		}
		catch(e){

			console.error(
				'[Custom Friends] Render error',
				e
			);

		}
		finally{

			rendering=false;

			queueMicrotask(
				()=>{

					suppressMutations=false;

				}
			);
		}
	}

	function scheduleRender(){

		if(renderTimer)
			clearTimeout(
				renderTimer
			);

		renderTimer=
			setTimeout(
				()=>{

					renderTimer=null;

					if(!rendering)
						render();

				},
				150
			);
	}

	function setupObservers(){

		const c=
			container();

		if(!c)
			return;

		if(
			containerObserver||
			parentObserver
		)
			return;

		friendsContainer=
			c;

		friendsParent=
			c.parentElement;

		containerObserver=
			new MutationObserver(
				mutations=>{

					if(
						suppressMutations||
						rendering
					)
						return;

					for(
						const mutation of mutations
					){

						if(
							mutation.type===
							'childList'
						){

							scheduleRender();

							return;
						}
					}
				}
			);

		containerObserver.observe(
			c,
			{
				childList:true
			}
		);

		if(friendsParent){

			parentObserver=
				new MutationObserver(
					()=>{

						const current=
							$('.friends-carousel-list-container');

						if(
							current&&
							current!==
							friendsContainer
						){

							hideFriendPopup();

							if(containerObserver){

								containerObserver.disconnect();
								containerObserver=null;
							}

							if(parentObserver){

								parentObserver.disconnect();
								parentObserver=null;
							}

							friendsContainer=
								current;

							friendsParent=
								current.parentElement;

							scheduleRender();

							setTimeout(
								setupObservers,
								200
							);
						}
					}
				);

			parentObserver.observe(
				friendsParent,
				{
					childList:true
				}
			);
		}
	}

	async function start(){

		if(started)
			return;

		started=true;

		styles();

		captureRealFriendCount();

		await resolve();

		await loadVerifiedBadges();

		render();

		await Promise.all([
			loadAvatars(),
			updatePresence()
		]);

		render();

		setupObservers();

		presenceTimer=
			setInterval(
				async()=>{

					const changed=
						await updatePresence();

					if(changed)
						scheduleRender();

					updateCounter();

				},
				10000
			);

		updateCounter();
	}

	const wait=
		setInterval(
			()=>{

				const c=
					$('.friends-carousel-list-container');

				if(!c)
					return;

				clearInterval(wait);

				friendsContainer=
					c;

				friendsParent=
					c.parentElement;

				setTimeout(
					start,
					300
				);

			},
			250
		);

})();
