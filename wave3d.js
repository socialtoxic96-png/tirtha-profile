/* ==========================================================
   TIRTHA CHAKMA — 3D SCROLLING WAVE BACKGROUND
   Pure canvas 2D "flying grid" wave, perspective-projected,
   scroll + mouse reactive, with mobile & reduced-motion care.
========================================================== */

(function () {

    const canvas = document.getElementById("waveCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const prefersReducedMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const isCoarsePointer =
        window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    /* ------------------------------------------------------
       CONFIG (scaled down automatically for mobile)
    ------------------------------------------------------ */

    const isSmallScreen = window.innerWidth < 700;

    const config = {
        rows: isSmallScreen ? 16 : 26,
        cols: isSmallScreen ? 14 : 24,
        speed: prefersReducedMotion ? 0.08 : 0.55,
        waveAmp: isSmallScreen ? 14 : 26,
        waveFreq: 0.9,
        horizonRatio: 0.42,
        fov: 260,
        colorMain: [139, 92, 246],
        colorAccent: [232, 121, 249],
        colorHot: [192, 38, 211],
        maxDepth: 1600
    };

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, isSmallScreen ? 1.5 : 2);

    let scrollOffset = window.scrollY || 0;
    let targetScrollOffset = scrollOffset;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    let time = 0;
    let rafId = null;
    let running = true;

    /* ------------------------------------------------------
       RESIZE
    ------------------------------------------------------ */

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let resizeTimer = null;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 120);
    });

    /* ------------------------------------------------------
       INPUT — mouse parallax (desktop only)
    ------------------------------------------------------ */

    if (!isCoarsePointer) {
        window.addEventListener("mousemove", function (e) {
            targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });
    }

    window.addEventListener("scroll", function () {
        targetScrollOffset = window.scrollY || 0;
    }, { passive: true });

    /* ------------------------------------------------------
       PROJECTION HELPERS
       A point in "world" space (x: -1..1, z: depth) is
       projected to screen space using a simple perspective
       divide, producing the classic receding-grid 3D look.
    ------------------------------------------------------ */

    function project(worldX, worldZ, horizonY, camX, camTilt) {

        const z = worldZ + config.fov;
        const scale = config.fov / z;

        const screenX =
            width / 2 +
            (worldX - camX) * scale * (width * 0.62);

        const screenY =
            horizonY +
            scale * (height * 0.9) -
            camTilt * scale * 40;

        return { x: screenX, y: screenY, scale: scale };
    }

    /* ------------------------------------------------------
       DRAW
    ------------------------------------------------------ */

    function draw() {

        ctx.clearRect(0, 0, width, height);

        const horizonY = height * config.horizonRatio;

        const camX = mouseX * 0.25;
        const camTilt = mouseY * 0.4;

        const scrollWave = scrollOffset * 0.0025;

        /* -------- horizon glow line -------- */

        const glowGrad = ctx.createLinearGradient(
            0, horizonY - 40, 0, horizonY + 40
        );
        glowGrad.addColorStop(0, "rgba(139,92,246,0)");
        glowGrad.addColorStop(0.28, "rgba(139,92,246,0.08)");
        glowGrad.addColorStop(0.5, "rgba(232,121,249,0.28)");
        glowGrad.addColorStop(0.72, "rgba(192,38,211,0.10)");
        glowGrad.addColorStop(1, "rgba(139,92,246,0)");

        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, horizonY - 40, width, 80);

        /* -------- rows (depth lines, waving) -------- */

        const rowCount = config.rows;

        for (let r = 0; r < rowCount; r++) {

            const depthT = (r + (time * config.speed) % 1) / rowCount;
            const worldZ = depthT * config.maxDepth;

            if (worldZ < 4) continue;

            const alpha = Math.max(0, 1 - depthT) * 0.55;
            if (alpha <= 0.01) continue;

            ctx.beginPath();

            const segments = config.cols;

            for (let c = 0; c <= segments; c++) {

                const worldX = (c / segments - 0.5) * 2.4;

                // Layered flame distortion: broad wave + sharp flickering tongues.
                const flame =
                    Math.sin(worldX * 7.5 + time * 2.2 + depthT * 8 - scrollWave) * 0.58 +
                    Math.sin(worldX * 15.0 - time * 3.1 + depthT * 13) * 0.24 +
                    Math.sin(worldX * 29.0 + time * 4.7 - depthT * 9) * 0.10;

                const wave =
                    (Math.sin(
                        worldX * config.waveFreq * 3 +
                        time * 1.4 +
                        depthT * 6 -
                        scrollWave
                    ) * 0.42 + flame * 0.58) *
                    (config.waveAmp / config.fov) *
                    (1.15 - depthT * 0.48);

                const p = project(
                    worldX,
                    worldZ,
                    horizonY,
                    camX,
                    camTilt + wave * 60
                );

                if (c === 0) {
                    ctx.moveTo(p.x, p.y);
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }

            const useAccent = r % 6 === 0;
            const c1 = useAccent ? config.colorAccent : config.colorMain;

            ctx.strokeStyle =
                "rgba(" + c1[0] + "," + c1[1] + "," + c1[2] + "," + alpha + ")";

            ctx.lineWidth = Math.max(0.6, 1.6 * (1 - depthT));

            ctx.stroke();
        }

        /* -------- violet fire glow over the wave -------- */
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const fireGlow = ctx.createRadialGradient(
            width * 0.5, horizonY + height * 0.08, 0,
            width * 0.5, horizonY + height * 0.08, width * 0.65
        );
        fireGlow.addColorStop(0, "rgba(232,121,249,0.16)");
        fireGlow.addColorStop(0.35, "rgba(139,92,246,0.09)");
        fireGlow.addColorStop(1, "rgba(139,92,246,0)");
        ctx.fillStyle = fireGlow;
        ctx.fillRect(0, horizonY - 30, width, height * 0.65);
        ctx.restore();

        /* -------- verticals (converging lines) -------- */

        const vLines = isSmallScreen ? 9 : 13;

        ctx.lineWidth = 1;

        for (let i = 0; i <= vLines; i++) {

            const worldX = (i / vLines - 0.5) * 2.4;

            ctx.beginPath();

            let started = false;

            for (let r = 0; r <= rowCount; r += 1) {

                const depthT = (r + (time * config.speed) % 1) / rowCount;
                const worldZ = depthT * config.maxDepth;

                if (worldZ < 4) continue;

                // Layered flame distortion: broad wave + sharp flickering tongues.
                const flame =
                    Math.sin(worldX * 7.5 + time * 2.2 + depthT * 8 - scrollWave) * 0.58 +
                    Math.sin(worldX * 15.0 - time * 3.1 + depthT * 13) * 0.24 +
                    Math.sin(worldX * 29.0 + time * 4.7 - depthT * 9) * 0.10;

                const wave =
                    (Math.sin(
                        worldX * config.waveFreq * 3 +
                        time * 1.4 +
                        depthT * 6 -
                        scrollWave
                    ) * 0.42 + flame * 0.58) *
                    (config.waveAmp / config.fov) *
                    (1.15 - depthT * 0.48);

                const p = project(
                    worldX,
                    worldZ,
                    horizonY,
                    camX,
                    camTilt + wave * 60
                );

                if (!started) {
                    ctx.moveTo(p.x, p.y);
                    started = true;
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }

            const alpha = 0.12 + Math.sin(time * 2 + i) * 0.025;
            const vc = i % 3 === 0 ? config.colorAccent : config.colorMain;
            ctx.strokeStyle =
                "rgba(" + vc[0] + "," + vc[1] + "," + vc[2] + "," + alpha + ")";

            ctx.stroke();
        }
    }

    /* ------------------------------------------------------
       LOOP
    ------------------------------------------------------ */

    let lastFrame = 0;
    const frameInterval = isSmallScreen ? 1000 / 30 : 1000 / 60;

    function tick(now) {

        if (!running) return;

        rafId = requestAnimationFrame(tick);

        if (now - lastFrame < frameInterval) return;
        lastFrame = now;

        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        scrollOffset += (targetScrollOffset - scrollOffset) * 0.08;

        time += 0.016 * (prefersReducedMotion ? 0.15 : 1);

        draw();
    }

    /* ------------------------------------------------------
       VISIBILITY — pause when tab hidden (battery friendly)
    ------------------------------------------------------ */

    document.addEventListener("visibilitychange", function () {

        if (document.hidden) {
            running = false;
            if (rafId) cancelAnimationFrame(rafId);
        } else {
            running = true;
            lastFrame = 0;
            rafId = requestAnimationFrame(tick);
        }
    });

    /* ------------------------------------------------------
       INIT
    ------------------------------------------------------ */

    resize();
    draw();

    rafId = requestAnimationFrame(tick);

})();
