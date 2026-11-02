"use client"

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

export { gsap, ScrollTrigger, SplitText, useGSAP }

/** Las animaciones solo corren si la persona no pidió menos movimiento. */
export const CON_MOVIMIENTO = "(prefers-reduced-motion: no-preference)"
