/* ==========================================
   TIRTHA CHAKMA
   3D SCROLL + CODE BACKGROUND
========================================== */

const codeBackground = document.getElementById("codeBackground");

const codeLines = [
    "const developer = 'Tirtha Chakma';",
    "function learn() { return true; }",
    "<html>",
    "</html>",
    "body { background: #070313; }",
    "console.log('Hello World');",
    "let dream = 'Google Developer';",
    "const skills = ['Coding', 'Mathematics'];",
    "if (learning) { keepGoing(); }",
    "function createProject() {}",
    "010101010101",
    "010110100101",
    "git commit -m 'update'",
    "git push origin main",
    "class Portfolio {}",
    "npm start",
    "</developer>",
    "{ learning: true }"
];


/* ==========================================
   CREATE CODE BACKGROUND
========================================== */

function createCodeBackground() {

    if (!codeBackground) return;

    codeBackground.innerHTML = "";

    for (let i = 0; i < 45; i++) {

        const line = document.createElement("div");

        line.className = "code-line";

        line.textContent =
            codeLines[Math.floor(Math.random() * codeLines.length)];

        line.style.left =
            Math.random() * 100 + "%";

        line.style.top =
            Math.random() * 100 + "%";

        line.style.animationDelay =
            Math.random() * 8 + "s";

        line.style.animationDuration =
            8 + Math.random() * 10 + "s";

        codeBackground.appendChild(line);
    }
}

createCodeBackground();



/* ==========================================
   SHARED MOTION SETTINGS
========================================== */

const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isCoarsePointer =
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;



/* ==========================================
   PER-CARD 3D TILT
   (cursor-tracking on desktop, tap/drag tilt
   on touch devices — both use the same
   smoothed rAF engine)
========================================== */

const tiltSelector =
    ".profile-card, .info-card, .person-card, " +
    ".experience-card, .condition-card, " +
    ".special-card, .work-status-card, " +
    ".class-photo-card";

const tiltCards =
    document.querySelectorAll(tiltSelector);

tiltCards.forEach(function(card) {
    card.classList.add("tilt-3d", "tilt-resting");
});

const MAX_TILT = 10;

let activeTiltCard = null;
let activePointerX = 0;
let activePointerY = 0;

function applyTilt(card, clientX, clientY) {

    const rect = card.getBoundingClientRect();

    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;

    const tiltY = (relX - 0.5) * (MAX_TILT * 2);
    const tiltX = (0.5 - relY) * (MAX_TILT * 2);

    card.style.setProperty("--tilt-x", tiltX.toFixed(2) + "deg");
    card.style.setProperty("--tilt-y", tiltY.toFixed(2) + "deg");
    card.style.setProperty("--tilt-z", "12px");
}

function resetTilt(card) {

    card.classList.add("tilt-resting");
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--tilt-z", "0px");
}

if (!isCoarsePointer && !prefersReducedMotion) {

    /* DESKTOP: smooth cursor-follow tilt */

    tiltCards.forEach(function(card) {

        card.addEventListener("mouseenter", function() {
            activeTiltCard = card;
            card.classList.remove("tilt-resting");
        });

        card.addEventListener("mousemove", function(event) {
            activePointerX = event.clientX;
            activePointerY = event.clientY;
        });

        card.addEventListener("mouseleave", function() {
            activeTiltCard = null;
            resetTilt(card);
        });
    });

    (function tiltLoop() {

        if (activeTiltCard) {
            applyTilt(activeTiltCard, activePointerX, activePointerY);
        }

        requestAnimationFrame(tiltLoop);

    })();

} else if (!prefersReducedMotion) {

    /* TOUCH: light tilt while a finger is on the card */

    tiltCards.forEach(function(card) {

        card.addEventListener("touchmove", function(event) {

            if (!event.touches || !event.touches[0]) return;

            const touch = event.touches[0];

            card.classList.remove("tilt-resting");
            applyTilt(card, touch.clientX, touch.clientY);

        }, { passive: true });

        card.addEventListener("touchend", function() {
            resetTilt(card);
        });

        card.addEventListener("touchcancel", function() {
            resetTilt(card);
        });
    });
}



/* ==========================================
   3D SCROLL EFFECT (smoothed with rAF)
========================================== */

const sections = document.querySelectorAll("section");
const isNarrowViewport = window.innerWidth <= 600;

function updateScroll3D() {

    const screenCenter = window.innerHeight / 2;

    sections.forEach(function(section) {

        const rect = section.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;

        const distance =
            (sectionCenter - screenCenter) / window.innerHeight;

        if (prefersReducedMotion) {

            section.style.transform = "none";
            section.style.opacity = "1";
            return;
        }

        if (isNarrowViewport) {

            /* Mobile: gentle depth fade instead of full rotateX
               to avoid layout jank on small viewports, while
               still feeling like "3D motion". */

            const scale =
                Math.max(0.985, 1 - Math.abs(distance) * 0.012);

            const fade =
                Math.max(0.85, 1 - Math.abs(distance) * 0.10);

            section.style.transform =
                `perspective(1000px) scale(${scale})`;

            section.style.opacity = fade.toFixed(3);

            return;
        }

        const rotate =
            Math.max(-5, Math.min(5, distance * 5));

        const scale =
            Math.max(0.95, 1 - Math.abs(distance) * 0.025);

        section.style.transform =
            `perspective(1200px) rotateX(${rotate}deg) scale(${scale})`;
    });

    requestAnimationFrame(updateScroll3D);
}

requestAnimationFrame(updateScroll3D);



/* ==========================================
   SCROLL REVEAL
========================================== */

const revealItems =
    document.querySelectorAll(
        ".info-card, .person-card, .experience-card, .condition-card"
    );


const observer =
    new IntersectionObserver(

        function(entries) {

            entries.forEach(function(entry) {

                if (entry.isIntersecting) {

                    entry.target.classList.add(
                        "show-card"
                    );

                }

            });

        },

        {
            threshold: 0.15
        }

    );


revealItems.forEach(function(item) {

    item.classList.add("hidden-card");

    observer.observe(item);

});



/* ==========================================
   NAVIGATION
========================================== */

document.querySelectorAll(
    '.navbar a[href^="#"]'
).forEach(function(link) {

    link.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            const target =
                document.querySelector(
                    this.getAttribute("href")
                );

            if (target) {

                target.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

});



/* ==========================================
   CURRENT YEAR
========================================== */

console.log(
    "Tirtha Chakma Portfolio loaded successfully."
);

/* ==========================================
   DRAGON BACKGROUND 3D PARALLAX
========================================== */

const dragonBackground = document.getElementById("dragonBackground");

if (dragonBackground && !prefersReducedMotion) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    if (!isCoarsePointer) {
        window.addEventListener("pointermove", function(event) {
            targetX = (event.clientX / window.innerWidth - 0.5) * 18;
            targetY = (event.clientY / window.innerHeight - 0.5) * 12;
        }, { passive: true });
    }

    function animateDragonDepth() {
        currentX += (targetX - currentX) * 0.045;
        currentY += (targetY - currentY) * 0.045;

        const scrollDepth = Math.min(window.scrollY * 0.012, 16);
        dragonBackground.style.transform =
            `translate3d(${-currentX}px, ${-currentY - scrollDepth}px, 0) scale(1.08)`;

        requestAnimationFrame(animateDragonDepth);
    }

    animateDragonDepth();
}
