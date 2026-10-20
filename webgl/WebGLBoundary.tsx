'use client'

import { Component, type ReactNode } from 'react'
import { stageView } from '@/stage/view'

/** R3F rethrows renderer/shader errors into React; render nothing so the hero's SVG fallback returns. */
export class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    stageView.set({ webglReady: false })
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}
