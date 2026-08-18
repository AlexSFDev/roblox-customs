// ==UserScript==
// @name         Roblox Local Verified Badge
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Adds a local visual verified badge to Roblox UI
// @match        https://www.roblox.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const BADGE_CLASS =
        'custom-local-verified-badge';

    function log(...args) {
        console.log(
            '[Local Verified]',
            ...args
        );
    }

    /*
     * =========================================================
     * CREATE BADGE
     * =========================================================
     *
     * IMPORTANT:
     *
     * The badge is a normal inline-flex element.
     *
     * It is NOT absolute.
     * It does NOT modify the parent heading.
     * It does NOT create an oversized positioning box.
     */

    function createBadge(options = {}) {

        const {
            scale = 1,
            marginLeft = 0
        } = options;

        const badge =
            document.createElement('span');

        badge.className =
            `${BADGE_CLASS}`;

        badge.setAttribute(
            'aria-label',
            'Verified'
        );

        badge.setAttribute(
            'role',
            'img'
        );

        badge.style.cssText = `
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;

            flex: 0 0 auto !important;
            flex-shrink: 0 !important;

            width: var(--icon-size-large) !important;
            height: var(--icon-size-large) !important;

            margin-left: ${marginLeft}px !important;
            margin-right: 0 !important;

            padding: 0 !important;

            position: relative !important;

            vertical-align: middle !important;

            transform: scale(${scale}) !important;
            transform-origin: center center !important;

            z-index: 10 !important;

            line-height: 0 !important;

            pointer-events: none !important;
        `;

        badge.innerHTML = `
            <span
                aria-hidden="true"
                data-testid="foundation-web-icon"
                class="grow-0 shrink-0 basis-auto icon icon-filled-verified-backplate size-[var(--icon-size-large)] content-system-emphasis">
            </span>

            <span
                aria-hidden="true"
                data-testid="foundation-web-icon"
                class="grow-0 shrink-0 basis-auto icon icon-filled-verified-check size-[var(--icon-size-large)] absolute"
                style="color: white;">
            </span>
        `;

        return badge;
    }


    /*
     * =========================================================
     * PROFILE MENU
     * =========================================================
     *
     * Looks for:
     *
     * <a href="/users/profile">
     *     ...
     *     Alex
     * </a>
     */

    function addMenuBadge() {

        const links =
            document.querySelectorAll(
                'a[href="/users/profile"]'
            );

        for (const link of links) {

            /*
             * Don't add twice.
             */
            if (
                link.querySelector(
                    `.${BADGE_CLASS}`
                )
            ) {
                continue;
            }

            /*
             * Find the span whose text is exactly Alex.
             */
            const allSpans =
                link.querySelectorAll(
                    'span'
                );

            let alexSpan = null;

            for (const span of allSpans) {

                if (
                    span.textContent.trim() ===
                    'Alex'
                ) {
                    alexSpan = span;
                    break;
                }
            }

            if (!alexSpan) {
                continue;
            }

            /*
             * Walk upward until the direct child
             * of the profile link.
             */
            let nameContainer =
                alexSpan;

            while (
                nameContainer.parentElement &&
                nameContainer.parentElement !== link
            ) {

                nameContainer =
                    nameContainer.parentElement;
            }

            if (
                nameContainer.parentElement !== link
            ) {
                continue;
            }

            /*
             * Create badge.
             */
            const badge =
                createBadge({
                    scale: 1,
                    marginLeft: 6
                });

            /*
             * Put it directly after the name container.
             */
            nameContainer.insertAdjacentElement(
                'afterend',
                badge
            );

            log(
                'Added verified badge next to top-left Alex.'
            );
        }
    }


    /*
     * =========================================================
     * PROFILE PAGE
     * =========================================================
     *
     * Looks specifically for:
     *
     * <a class="user-name-container">
     *     Evening, Alex
     * </a>
     *
     * The badge is inserted directly after the username
     * WITHOUT changing the h1 itself.
     */

    function addProfileBadge() {

        const usernames =
            document.querySelectorAll(
                'a.user-name-container'
            );

        for (const username of usernames) {

            /*
             * Don't duplicate.
             */
            if (
                username.parentElement?.querySelector(
                    `.${BADGE_CLASS}`
                )
            ) {
                continue;
            }

            /*
             * Make sure this is Alex's profile.
             */
            if (
                !username.textContent
                    .trim()
                    .includes('Alex')
            ) {
                continue;
            }

            /*
             * Make sure we're actually inside
             * the profile heading.
             */
            const heading =
                username.closest('h1');

            if (!heading) {
                continue;
            }

            /*
             * Create badge.
             *
             * Slightly larger than the menu badge.
             */
            const badge =
                createBadge({
                    scale: 1.5,
                    marginLeft: 15
                });

            /*
             * DO NOT:
             *
             * - modify the h1
             * - modify the username element
             * - use absolute positioning
             * - change display on the h1
             *
             * Just place the badge immediately after
             * the username.
             */
            username.insertAdjacentElement(
                'afterend',
                badge
            );

            log(
                'Added verified badge directly beside profile username.'
            );
        }
    }


    /*
     * =========================================================
     * APPLY
     * =========================================================
     */

    function apply() {

        addMenuBadge();

        addProfileBadge();
    }


    /*
     * =========================================================
     * OBSERVER
     * =========================================================
     *
     * Roblox uses React and can recreate these elements.
     *
     * We batch mutations into one animation frame so
     * thousands of React mutations don't cause thousands
     * of apply() calls.
     */

    let scheduled = false;

    const observer =
        new MutationObserver(() => {

            if (scheduled) {
                return;
            }

            scheduled = true;

            requestAnimationFrame(() => {

                scheduled = false;

                apply();
            });
        });

    observer.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true
        }
    );


    /*
     * =========================================================
     * INITIAL ATTEMPTS
     * =========================================================
     */

    apply();

    setTimeout(
        apply,
        250
    );

    setTimeout(
        apply,
        1000
    );

    setTimeout(
        apply,
        2500
    );

    setTimeout(
        apply,
        5000
    );


    log(
        'Local verified badge script loaded.'
    );

})();
