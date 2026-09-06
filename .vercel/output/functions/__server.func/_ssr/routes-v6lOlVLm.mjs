import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Pause, c as Download, i as Play, n as Volume2, o as Minimize, s as Maximize, t as VolumeX } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-v6lOlVLm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatTime(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}
var FALLBACK_CHAPTERS = [
	{
		id: "wait",
		t: 2.4,
		title: "The wait"
	},
	{
		id: "red",
		t: 8.4,
		title: "The red light"
	},
	{
		id: "person",
		t: 14.5,
		title: "A person waiting"
	},
	{
		id: "offer",
		t: 20.5,
		title: "A different way"
	},
	{
		id: "device",
		t: 26.6,
		title: "VeinVision"
	},
	{
		id: "see",
		t: 32.6,
		title: "Seeing clearly"
	},
	{
		id: "ease",
		t: 40.1,
		title: "At ease"
	},
	{
		id: "how",
		t: 46.1,
		title: "The device"
	},
	{
		id: "message",
		t: 52.6,
		title: "The message"
	}
];
function FilmPlayer() {
	const videoRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [time, setTime] = (0, import_react.useState)(0);
	const [duration, setDuration] = (0, import_react.useState)(0);
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [fs, setFs] = (0, import_react.useState)(false);
	const [started, setStarted] = (0, import_react.useState)(false);
	const [chapters, setChapters] = (0, import_react.useState)(FALLBACK_CHAPTERS);
	const [hovering, setHovering] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		fetch("/video/chapters.json").then((r) => r.ok ? r.json() : null).then((data) => {
			if (!cancelled && data?.chapters?.length) {
				setChapters(data.chapters);
				if (typeof data.duration === "number") setDuration(data.duration);
			}
		}).catch(() => {});
		return () => {
			cancelled = true;
		};
	}, []);
	const onTime = (0, import_react.useCallback)(() => {
		const v = videoRef.current;
		if (!v) return;
		setTime(v.currentTime);
		if (v.duration && Number.isFinite(v.duration)) setDuration(v.duration);
	}, []);
	(0, import_react.useEffect)(() => {
		const v = videoRef.current;
		if (!v) return;
		const onPlay = () => setPlaying(true);
		const onPause = () => setPlaying(false);
		const onEnd = () => {
			setPlaying(false);
			setStarted(true);
		};
		v.addEventListener("timeupdate", onTime);
		v.addEventListener("play", onPlay);
		v.addEventListener("pause", onPause);
		v.addEventListener("ended", onEnd);
		v.addEventListener("loadedmetadata", onTime);
		return () => {
			v.removeEventListener("timeupdate", onTime);
			v.removeEventListener("play", onPlay);
			v.removeEventListener("pause", onPause);
			v.removeEventListener("ended", onEnd);
			v.removeEventListener("loadedmetadata", onTime);
		};
	}, [onTime]);
	const toggle = (0, import_react.useCallback)(() => {
		const v = videoRef.current;
		if (!v) return;
		setStarted(true);
		if (v.paused) v.play();
		else v.pause();
	}, []);
	const seek = (0, import_react.useCallback)((t) => {
		const v = videoRef.current;
		if (!v) return;
		v.currentTime = Math.max(0, Math.min(t, v.duration || t));
		setStarted(true);
		v.play();
	}, []);
	const toggleFs = (0, import_react.useCallback)(() => {
		const el = wrapRef.current;
		if (!el) return;
		if (document.fullscreenElement) {
			document.exitFullscreen();
			setFs(false);
		} else {
			el.requestFullscreen();
			setFs(true);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		const onFs = () => setFs(Boolean(document.fullscreenElement));
		document.addEventListener("fullscreenchange", onFs);
		return () => document.removeEventListener("fullscreenchange", onFs);
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			if (e.key === " " || e.key === "k") {
				e.preventDefault();
				toggle();
			} else if (e.key === "m") setMuted((m) => !m);
			else if (e.key === "f") toggleFs();
			else if (e.key === "ArrowRight") seek((videoRef.current?.currentTime ?? 0) + 5);
			else if (e.key === "ArrowLeft") {
				const v = videoRef.current;
				if (v) v.currentTime = Math.max(0, v.currentTime - 5);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		seek,
		toggle,
		toggleFs
	]);
	const pct = duration > 0 ? time / duration * 100 : 0;
	const active = [...chapters].reverse().find((c) => time + .05 >= c.t) ?? chapters[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex w-full flex-col gap-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: wrapRef,
			className: "group relative overflow-hidden rounded-[var(--radius-xl)] bg-ink shadow-[0_24px_80px_-32px_rgba(28,27,25,0.55)]",
			onMouseEnter: () => setHovering(true),
			onMouseLeave: () => setHovering(playing ? false : true),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-video w-full bg-ink",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						ref: videoRef,
						className: "h-full w-full object-cover",
						poster: "/video/poster.jpg",
						playsInline: true,
						preload: "auto",
						muted,
						onClick: toggle,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("source", {
							src: "/video/veinvision.mp4",
							type: "video/mp4"
						})
					}),
					!started && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: toggle,
						className: "absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink/25 text-paper",
						"aria-label": "Play film",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex h-20 w-20 items-center justify-center rounded-full bg-paper text-ink shadow-lg transition-transform duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)] hover:scale-105",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "ml-1 h-8 w-8 fill-current" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-xl italic tracking-tight text-paper md:text-2xl",
							children: "Play the film"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent pt-16 transition-opacity duration-[var(--motion-fast)]", hovering || !playing ? "opacity-100" : "opacity-0") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("absolute inset-x-0 bottom-0 flex flex-col gap-2 px-3 pb-3 pt-2 transition-opacity duration-[var(--motion-fast)] md:px-4 md:pb-4", hovering || !playing ? "opacity-100" : "opacity-0"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: duration || 1,
								step: .05,
								value: time,
								"aria-label": "Seek",
								onChange: (e) => {
									const v = videoRef.current;
									if (!v) return;
									v.currentTime = Number(e.target.value);
									setTime(v.currentTime);
								},
								className: "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-paper/25 accent-vein [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-paper",
								style: { background: `linear-gradient(to right, var(--color-vein) ${pct}%, rgba(246,243,236,0.25) ${pct}%)` }
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1 text-paper md:gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper/10",
									onClick: toggle,
									"aria-label": playing ? "Pause" : "Play",
									children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "h-5 w-5 fill-current" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-5 w-5 fill-current" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper/10",
									onClick: () => setMuted((m) => !m),
									"aria-label": muted ? "Unmute" : "Mute",
									children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "h-5 w-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "ml-1 min-w-[4.6rem] font-sans text-xs tabular-nums text-paper/80",
									children: [
										formatTime(time),
										" / ",
										formatTime(duration)
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 hidden truncate font-display text-sm italic text-paper/80 sm:block",
									children: active?.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "ml-auto flex items-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: "/video/veinvision.mp4",
										download: "VeinVision-SIA.mp4",
										className: "flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper/10",
										"aria-label": "Download film",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-5 w-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper/10",
										onClick: toggleFs,
										"aria-label": fs ? "Exit fullscreen" : "Fullscreen",
										children: fs ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minimize, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize, { className: "h-5 w-5" })
									})]
								})
							]
						})]
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			"aria-label": "Scenes",
			className: "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
			children: chapters.filter((c) => c.id !== "title").map((c) => {
				const on = active?.id === c.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => seek(c.t + .05),
					className: cn("shrink-0 rounded-full border px-3.5 py-2 text-left text-xs font-medium transition-colors duration-[var(--motion-fast)]", on ? "border-ink bg-ink text-paper" : "border-line bg-paper text-muted hover:border-ink hover:text-ink"),
					children: c.title
				}, c.id);
			})
		})]
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[opacity,transform,background-color,color,border-color] duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vein/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-ink text-paper hover:opacity-90 active:scale-[0.98]",
			vein: "bg-vein text-paper hover:opacity-90 active:scale-[0.98]",
			outline: "border border-line bg-transparent text-ink hover:bg-ink hover:text-paper",
			ghost: "text-ink hover:bg-line/70",
			inverse: "bg-paper text-ink hover:bg-paper/90 active:scale-[0.98]"
		},
		size: {
			default: "h-11 px-5",
			sm: "h-9 px-3.5 text-xs",
			lg: "h-12 px-6",
			icon: "h-11 w-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative min-h-dvh overflow-x-hidden bg-paper text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(31,138,98,0.08),transparent_60%)]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex h-8 w-8 items-center justify-center rounded-full border border-line",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
							viewBox: "0 0 24 24",
							className: "h-4 w-4",
							"aria-hidden": "true",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								cx: "12",
								cy: "12",
								r: "7.2",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.6"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M7.5 13.2c1.6-2.4 2.7-2.4 4.2 0 1.5 2.3 2.7 2.3 4.3 0",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.6",
								strokeLinecap: "round"
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-lg leading-none tracking-tight",
						children: "VeinVision"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[11px] uppercase tracking-[0.18em] text-muted",
						children: "SIA Community Voting"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "outline",
					size: "sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "/video/veinvision.mp4",
						download: "VeinVision-SIA.mp4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "Download"]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mx-auto w-full max-w-6xl px-5 pb-6 pt-2 md:px-8 md:pt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-8 max-w-3xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium uppercase tracking-[0.22em] text-vein",
							children: "A 50-second film"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "mt-3 font-display text-[2.05rem] leading-[1.12] tracking-[-0.03em] text-balance md:text-5xl",
							children: ["When you can see better,", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "italic text-ink/80",
								children: " you can care better."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted md:text-lg",
							children: "A nurse. A patient. A long wait. Then a quieter way to find a vein — and a calmer moment between two people."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilmPlayer, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 md:grid-cols-3 md:px-8 md:py-12",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoryCard, {
						k: "01",
						title: "The human cost",
						body: "Finding a vein can be routine for a nurse. For a patient, it can feel like a long wait — sometimes painful."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoryCard, {
						k: "02",
						title: "A different way",
						body: "A colleague offers VeinVision: a compact, pocket-friendly handheld that maps veins onto the skin. No phone. No laptop."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoryCard, {
						k: "03",
						title: "Care, restored",
						body: "The nurse sees clearly, looks back into the patient’s eyes, and finds relief there. Technology in service of trust."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "mx-auto w-full max-w-6xl border-t border-line px-5 py-8 md:px-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 md:flex-row md:items-end md:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-md font-display text-lg italic leading-snug text-ink/80",
						children: "The device is not the protagonist. The nurse and the patient are."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Original stickman film for SIA Community Voting. Original score and narration."
					})]
				})
			})
		]
	});
}
function StoryCard({ k, title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-[calc(var(--radius-xl)+4px)] border border-line bg-paper-2/50 p-5 md:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-sans text-xs tabular-nums tracking-[0.16em] text-vein",
				children: k
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-3 font-display text-xl tracking-tight",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-pretty text-muted",
				children: body
			})
		]
	});
}
//#endregion
export { Home as component };
