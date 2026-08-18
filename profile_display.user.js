// ==UserScript==
// @name         Roblox Profile Display
// @namespace    http://tampermonkey.net/
// @version      2.2
// @match        https://www.roblox.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (window.location.pathname !== "/users/YOUR USER ID/profile") {
        return;
    }

    const fakeName = "YOUR FAKE NAME";
    const fakeRep = "YOUR FAKE REP/LIKES";
    const fakeFollowers = "YOUR FAKE FOLLOWERS";

    let followerElement = null;
    let updating = false;

    function updateProfile() {
        if (updating) return;
        updating = true;

        const name = document.getElementById("profile-header-title-container-name");
        const rep = document.getElementById("repValueText");

        const roproIcon = document.querySelector(".ropro-profile-icon");

        if (roproIcon) {
            roproIcon.src = "chrome-extension://adbacgifemdbhdkfppmeilbgppmhaobf/images/rex_icon.png";
        }

        if (!followerElement) {
            followerElement = [...document.querySelectorAll("a span")]
                .find(el => el.textContent.includes("Followers"));
        }

        if (name && name.textContent !== fakeName)
            name.textContent = fakeName;

        if (rep && rep.textContent !== fakeRep)
            rep.textContent = fakeRep;

        if (followerElement && followerElement.textContent !== fakeFollowers)
            followerElement.textContent = fakeFollowers;


        if (name && !document.querySelector(".fake-verified-badge")) {
            const verified = document.createElement("span");
            verified.className = "fake-verified-badge relative flex items-center justify-center";
            verified.innerHTML = `
                <span aria-hidden="true" data-testid="foundation-web-icon"
                class="grow-0 shrink-0 basis-auto icon icon-filled-verified-backplate size-[var(--icon-size-large)] content-system-emphasis"></span>
                <span aria-hidden="true" data-testid="foundation-web-icon"
                class="grow-0 shrink-0 basis-auto icon icon-filled-verified-check size-[var(--icon-size-large)] absolute"
                style="color:white;"></span>
            `;

            name.parentElement.appendChild(verified);
        }

        if (name && !document.querySelector(".fake-roblox-plus")) {
            const plus = document.createElement("span");
            plus.className = "fake-roblox-plus items-center gap-xxsmall inline-flex shrink-0";
            plus.innerHTML = `
                <span aria-hidden="true" data-testid="foundation-web-icon"
                class="grow-0 shrink-0 basis-auto icon icon-regular-roblox-plus size-[var(--icon-size-large)] content-system-contrast"
                aria-label="Roblox Plus subscriber"></span>
            `;

            name.parentElement.appendChild(plus);
        }

        const badgeList = document.querySelector(".btr-profile-robloxbadges .hlist");

        if (badgeList && !document.querySelector(".fake-roblox-badges")) {

            const badges = [
                {
                    id: "Badge17",
                    name: "Official Model Maker",
                    img: "https://images.rbxcdn.com/45710972c9c8d556805f8bee89389648.png"
                },
                {
                    id: "Badge8",
                    name: "Inviter",
                    img: "https://images.rbxcdn.com/01044aca1d917eb20bfbdc5e25af1294.png"
                },
                {
                    id: "Badge18",
                    name: "Welcome To The Club",
                    img: "https://images.rbxcdn.com/6c2a598114231066a386fa716ac099c4.png"
                },
                {
                    id: "Badge3",
                    name: "Combat Initiation",
                    img: "https://images.rbxcdn.com/8d77254fc1e6d904fd3ded29dfca28cb.png"
                },
                {
                    id: "Badge4",
                    name: "Warrior",
                    img: "https://images.rbxcdn.com/0a010c31a8b482731114810590553be3.png"
                },
                {
                    id: "Badge5",
                    name: "Bloxxer",
                    img: "https://images.rbxcdn.com/139a7b3acfeb0b881b93a40134766048.png"
                }
            ];


            badges.forEach(badge => {

                const li = document.createElement("li");

                li.className = "list-item badge-item asset-item fake-roblox-badges";

                li.innerHTML = `
                    <a href="/info/roblox-badges#${badge.id}" class="badge-link">
                        <span class="asset-thumb-container">
                            <img src="${badge.img}">
                        </span>
                        <span class="font-header-2 text-overflow item-name">${badge.name}</span>
                    </a>
                `;

                badgeList.appendChild(li);

            });
        }


        updating = false;
    }


    const timer = setInterval(() => {

        const header = document.querySelector(".user-profile-header");

        if (header) {

            clearInterval(timer);

            updateProfile();

            const observer = new MutationObserver(() => {
                requestAnimationFrame(updateProfile);
            });

            observer.observe(header, {
                childList: true,
                subtree: true,
                characterData: true
            });

        }

    }, 50);

})();
