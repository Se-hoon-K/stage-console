'use client'

import { Component, Fragment, type ReactNode } from 'react'
import { stageView } from '@/stage/view'

type State = { failed: boolean; attempt: number }

const RETRY_MS = 1000

/**
 * R3F rethrows renderer/shader/loader errors into React. Show nothing (the SVG drawing returns), log why,
 * and retry once after a second — a one-off chunk 404 after a deploy or a GPU hiccup usually clears.
 */
export class WebGLBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false, attempt: 0 }
  private retry = 0

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[stage] WebGL scene failed, showing the drawing:', error)
    stageView.set({ webglReady: false })
    if (this.state.attempt === 0) {
      this.retry = window.setTimeout(() => this.setState({ failed: false, attempt: 1 }), RETRY_MS)
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.retry)
  }

  render() {
    // A new key on retry remounts the subtree, so next/dynamic re-requests the chunk.
    return this.state.failed ? null : <Fragment key={this.state.attempt}>{this.props.children}</Fragment>
  }
}
