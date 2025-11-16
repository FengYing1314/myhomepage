<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

interface LinkItem {
  id: string
  label: string
  description: string
  url: string
  badge?: string
  ogImage: string
}

interface ActivityItem {
  id: string
  source: 'github' | 'blog'
  title: string
  subtitle: string
  url: string
  timestamp: string
}

interface HeatmapCell {
  date: string
  count: number
}

interface PointerTrailPoint {
  id: number
  x: number
  y: number
  createdAt: number
}

interface MusicTrack {
  id: string
  title: string
  artist: string
  url: string
  cover: string
  mood: string
  length: string
}

const displayName = '枫莹'
const displayNameEn = 'FengYing'
const tagline = '后端 / 全栈开发'
const heroTags = ['C#', 'Python', 'TypeScript', 'Vue 3', 'DevOps', 'Unity']

/**
 * 音乐播放列表管理
 * 
 * 添加歌曲：复制下面的对象格式，添加到数组中
 * 删除歌曲：直接删除整个对象
 * 
 * 字段说明：
 * - id: 唯一标识，使用英文短横线命名
 * - title: 歌曲名称
 * - artist: 艺术家/作者
 * - url: 音频文件地址（必须可访问）
 * - cover: 封面图片地址
 * - mood: 歌曲风格描述
 * - length: 歌曲时长（格式：mm:ss）
 */
const featuredTracks: MusicTrack[] = [
  {
    id: 'Until the last day',
    title: '直到最后一天',
    artist: 'COP,乐正绫',
    url: 'https://image.fengying.xin/Image%20hosting/COP%2C%E4%B9%90%E6%AD%A3%E7%BB%AB%20-%20%E7%9B%B4%E5%88%B0%E6%9C%80%E5%90%8E%E4%B8%80%E5%A4%A9%EF%BC%88piano.ver%EF%BC%89.mp3',
    cover:
      'https://image.fengying.xin/Image%20hosting/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-11-15%20144556.png',
    mood: 'Virtual Vocaloid',
    length: '03:47'
  },
  {
    id: 'Fragile',
    title: 'こわれもの',
    artist: 'kyiku,裏命',
    url: 'https://image.fengying.xin/Image%20hosting/kyiku%2C%E8%A3%8F%E5%91%BD%20-%20%E3%81%93%E3%82%8F%E3%82%8C%E3%82%82%E3%81%AE.mp3',
    cover:
      'https://image.fengying.xin/Image%20hosting/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-11-15%20145211.png',
    mood: 'Sorcery',
    length: '03:08'
  },
  {
    id: 'Life and the journey of being alone',
    title: '人生和只身一人的旅程',
    artist: '奥莉安多幻想曲,乐正绫',
    url: 'https://image.fengying.xin/Image%20hosting/%E5%A5%A5%E8%8E%89%E5%AE%89%E5%A4%9A%E5%B9%BB%E6%83%B3%E6%9B%B2%2C%E4%B9%90%E6%AD%A3%E7%BB%AB%20-%20%E4%BA%BA%E7%94%9F%E5%92%8C%E5%8F%AA%E8%BA%AB%E4%B8%80%E4%BA%BA%E7%9A%84%E6%97%85%E7%A8%8B%E3%80%82.mp3',
    cover:
      'https://image.fengying.xin/Image%20hosting/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-11-15%20145819.png',
    mood: 'Virtual Vocaloid',
    length: '02:35'
  },
  {
    id: 'Spring shadow',
    title: '春日影',
    artist: 'mygo',
    url: 'https://image.fengying.xin/Image%20hosting/MyGO!!!!!%20-%20%E6%98%A5%E6%97%A5%E5%BD%B1%20(MyGO!!!!!%20ver.).mp3',
    cover:
        'https://image.fengying.xin/Image%20hosting/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-11-15%20150347.png',
    mood: 'Girl band',
    length: '04:16'
  }
]

// 默认占位轨道，当没有歌曲时显示
const defaultTrack: MusicTrack = {
  id: 'placeholder',
  title: '静候中',
  artist: 'fy',
  url: '',
  cover: 'https://image.fengying.xin/Image%20hosting/%E7%94%98%E5%9F%8E%E5%8A%A8%E5%9B%BE.gif',
  mood: 'Ambient · Chill',
  length: '00:00'
}

const GITHUB_EVENTS_ENDPOINT =
  'https://api.github.com/users/FengYing1314/events/public?per_page=100'
const BLOG_FEED_ENDPOINT = 'https://blog.fengying.xin/feed'
const BLOG_FEED_FALLBACK = '/feed.rss'
const TOTAL_WEEKS = 5
const SUB_CELLS_PER_DAY = 4
const HEATMAP_ROWS = 7
const HEATMAP_COLUMNS = TOTAL_WEEKS * SUB_CELLS_PER_DAY
const ACTIVITY_RANGE_MS = 30 * 24 * 60 * 60 * 1000

function buildOgImage(url: string): string {
  const encoded = encodeURIComponent(url)
  return `https://t.alcy.cc/pc/?url=${encoded}`
}

// 指路标数据（GitHub/B站/Steam 等入口），用于渲染 OG 缩略图卡片。
const links: LinkItem[] = [
  {
    id: 'github',
    label: 'GitHub',
    description: '灵感和 side project 都先塞进这里，都是我喜欢的节奏。',
    url: 'https://github.com/FengYing1314',
    badge: 'CODE',
    ogImage: buildOgImage('https://github.com/FengYing1314')
  },
  {
    id: 'bilibili',
    label: 'B 站',
    description: '生活碎片、剪辑和一点点现场，慢慢装进这个小窝。',
    url: 'https://space.bilibili.com/1499874172',
    badge: '视频',
    ogImage: buildOgImage('https://space.bilibili.com/1499874172')
  },
  {
    id: 'steam',
    label: 'Steam',
    description: '和朋友开黑、收集灵感的补给站，喜欢音游和RTS喵。',
    url: 'https://steamcommunity.com/id/fengyingqwq/',
    badge: 'GAME',
    ogImage: buildOgImage('https://steamcommunity.com/id/fengyingqwq/')
  },
  {
    id: 'blog',
    label: 'Blog',
    description: '博客喵 记录想法、学习与生活，慢慢写....',
    url: 'https://blog.fengying.xin/',
    badge: 'BLOG',
    ogImage: buildOgImage('https://blog.fengying.xin/')
  },
  {
    id: 'status',
    label: 'Status',
    description: '咱的服务器监控，盯着服务器心跳，保证一切在线。',
    url: 'https://status.fengying.xin/',
    badge: '监控',
    ogImage: buildOgImage('https://status.fengying.xin/')
  },
  {
    id: 'api',
    label: 'LLM API',
    description: 'newapi 让自己有无障碍使用的接口喵~',
    url: 'https://api.fengying.xin/',
    badge: 'API',
    ogImage: buildOgImage('https://api.fengying.xin/')
  }
]

const githubActivities = ref<ActivityItem[]>([])
const blogActivities = ref<ActivityItem[]>([])
const githubLoading = ref(false)
const blogLoading = ref(false)
const githubError = ref<string | null>(null)
const blogError = ref<string | null>(null)
const pointerTrail = ref<PointerTrailPoint[]>([])
const audioRef = ref<HTMLAudioElement | null>(null)
const currentTrackIndex = ref(0)
const trackProgress = ref(0)
const trackDuration = ref(0)
const isPlaying = ref(false)

const MAX_TRAIL_POINTS = 14
const TRAIL_LIFETIME_MS = 700
let trailCleanupTimer: number | undefined
let pointerTrailRaf: number | undefined
let pendingPointer: { x: number; y: number } | null = null

const currentTrack = computed<MusicTrack>(() => {
  if (!featuredTracks.length) return defaultTrack
  const normalizedIndex = normalizeTrackIndex(currentTrackIndex.value)
  return featuredTracks[normalizedIndex] ?? defaultTrack
})

const progressPercent = computed(() => {
  if (!trackDuration.value) return 0
  return Math.min((trackProgress.value / trackDuration.value) * 100, 100)
})

function formatPlayerTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '00:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function normalizeTrackIndex(index: number): number {
  if (!featuredTracks.length) return 0
  const length = featuredTracks.length
  return ((index % length) + length) % length
}

async function restartAudio(autoPlay: boolean) {
  await nextTick()
  const audio = audioRef.value
  if (!audio) return
  audio.currentTime = 0
  trackProgress.value = 0
  if (!autoPlay) return
  try {
    await audio.play()
  } catch {
    // autoplay might be blocked until the user interacts again
  }
}

function selectTrack(index: number) {
  if (!featuredTracks.length) return
  const nextIndex = normalizeTrackIndex(index)
  currentTrackIndex.value = nextIndex
  trackDuration.value = 0
  const audio = audioRef.value
  if (audio) {
    audio.pause()
  }
  void restartAudio(true)
}

function playPreviousTrack() {
  selectTrack(currentTrackIndex.value - 1)
}

function playNextTrack() {
  selectTrack(currentTrackIndex.value + 1)
}

function togglePlayback() {
  const audio = audioRef.value
  if (!audio) return
  if (audio.paused) {
    void audio.play().catch(() => {})
  } else {
    audio.pause()
  }
}

function handleSeekInput(event: Event) {
  const audio = audioRef.value
  if (!audio) return
  const input = event.target as HTMLInputElement
  const value = Number(input.value)
  if (!Number.isFinite(value)) return
  audio.currentTime = value
  trackProgress.value = value
}

function handleAudioTimeUpdate(event: Event) {
  const target = event.target as HTMLAudioElement
  trackProgress.value = target.currentTime
}

function handleAudioLoaded(event: Event) {
  const target = event.target as HTMLAudioElement
  trackDuration.value = target.duration || 0
}

function handleAudioPlay() {
  isPlaying.value = true
}

function handleAudioPause() {
  isPlaying.value = false
}

function handleTrackEnded() {
  playNextTrack()
}

function prunePointerTrail(now = performance.now()) {
  pointerTrail.value = pointerTrail.value.filter(
    (point) => now - point.createdAt < TRAIL_LIFETIME_MS
  )
}

function enqueuePointerTrailUpdate() {
  if (pointerTrailRaf !== undefined) return
  pointerTrailRaf = window.requestAnimationFrame(() => {
    pointerTrailRaf = undefined
    if (!pendingPointer) return
    const { x, y } = pendingPointer
    pendingPointer = null
    const now = performance.now()
    prunePointerTrail(now)
    pointerTrail.value = [
      ...pointerTrail.value,
      { id: now, x, y, createdAt: now }
    ].slice(-MAX_TRAIL_POINTS)
  })
}

function handlePointerMove(event: PointerEvent) {
  if (event.pointerType && event.pointerType !== 'mouse') return
  pendingPointer = { x: event.clientX, y: event.clientY }
  enqueuePointerTrailUpdate()
}

function startPointerTrail() {
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  trailCleanupTimer = window.setInterval(() => prunePointerTrail(), 80)
}

function stopPointerTrail() {
  window.removeEventListener('pointermove', handlePointerMove)
  if (trailCleanupTimer !== undefined) {
    window.clearInterval(trailCleanupTimer)
    trailCleanupTimer = undefined
  }
  if (pointerTrailRaf !== undefined) {
    window.cancelAnimationFrame(pointerTrailRaf)
    pointerTrailRaf = undefined
  }
  pendingPointer = null
  pointerTrail.value = []
}

function pointerTrailOpacity(index: number): number {
  const total = pointerTrail.value.length || 1
  return (index + 1) / total
}

function pointerTrailScale(index: number): number {
  const total = pointerTrail.value.length
  if (total <= 1) return 1
  const progress = index / (total - 1)
  return 0.7 + progress * 0.4
}

const activityCounter = computed(() => {
  const cutoff = Date.now() - ACTIVITY_RANGE_MS
  const githubCount = githubActivities.value.filter((item) => {
    const time = new Date(item.timestamp).getTime()
    return item.source === 'github' && !Number.isNaN(time) && time >= cutoff
  }).length
  const blogCount = blogActivities.value.filter((item) => {
    const time = new Date(item.timestamp).getTime()
    return item.source === 'blog' && !Number.isNaN(time) && time >= cutoff
  }).length
  return `${githubCount} GitHub动态 · ${blogCount} Blog条目`
})

// 将 GitHub + Blog 活动合并，筛选一年内的数据并按时间倒序。
const activityItems = computed<ActivityItem[]>(() => {
  const cutoff = Date.now() - ACTIVITY_RANGE_MS
  return [...githubActivities.value, ...blogActivities.value]
    .filter((item) => {
      const time = new Date(item.timestamp).getTime()
      return !Number.isNaN(time) && time >= cutoff
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

// 基于 GitHub 活动构造 52 周的贡献热力图。
const heatmapCells = computed<HeatmapCell[]>(() => {
  const totalDays = TOTAL_WEEKS * 7
  const today = new Date()
  const counts = new Map<string, number>()

  githubActivities.value.forEach((activity) => {
    const date = new Date(activity.timestamp)
    if (Number.isNaN(date.getTime())) return
    const key = formatDate(date)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })

  const cells: HeatmapCell[] = []
  for (let i = totalDays - 1; i >= 0; i -= 1) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = formatDate(d)
    const count = counts.get(key) ?? 0
    for (let j = 0; j < SUB_CELLS_PER_DAY; j += 1) {
      cells.push({ date: key, count })
    }
  }
  return shuffleHeatmapCells(cells)
})

const maxHeatmapCount = computed(() =>
  heatmapCells.value.reduce((max, cell) => (cell.count > max ? cell.count : max), 0)
)

const heatmapGridStyle = computed(() => ({
  '--heatmap-columns': `${HEATMAP_COLUMNS}`,
  '--heatmap-rows': `${HEATMAP_ROWS}`,
}))

function describeHeatmapCell(cell: HeatmapCell): string {
  const label = cell.count === 0 ? '今天摸鱼' : `${cell.count} 次活跃`
  return `${cell.date} · ${label}`
}

function heatmapLevel(count: number): string {
  if (count === 0) return 'level-0'
  const max = maxHeatmapCount.value || 1
  if (count < max * 0.35) return 'level-1'
  if (count < max * 0.7) return 'level-2'
  return 'level-3'
}

function shuffleHeatmapCells(list: HeatmapCell[]): HeatmapCell[] {
  const array = [...list]
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = array[i]
    const swapTarget = array[j]
    if (current === undefined || swapTarget === undefined) continue
    array[i] = swapTarget
    array[j] = current
  }
  return array
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatHostname(target: string): string {
  try {
    return new URL(target).hostname
  } catch {
    return target
  }
}

function openLink(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// 拉取公开 GitHub Events，并转成前端展示用的文本与链接。
async function fetchGithubActivities() {
  githubLoading.value = true
  githubError.value = null
  try {
    const response = await fetch(GITHUB_EVENTS_ENDPOINT)
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }
    const raw = (await response.json()) as any[]
    const mapped: ActivityItem[] = raw.map((event) => {
      const type = event.type as string
      const repoName = event.repo?.name ?? ''
      const createdAt = event.created_at as string
      let title = 'GitHub 更新'
      let subtitle = repoName || 'GitHub'
      let url = repoName ? `https://github.com/${repoName}` : 'https://github.com/'

      if (type === 'PushEvent') {
        const count = event.payload?.commits?.length ?? 1
        title = `推送了 ${count} 个提交`
      } else if (type === 'IssuesEvent') {
        const action = event.payload?.action ?? 'updated'
        const issueNumber = event.payload?.issue?.number ?? ''
        const readable =
          action === 'opened' ? '新建了 Issue' : action === 'closed' ? '关闭了 Issue' : '更新了 Issue'
        title = `${readable} #${issueNumber}`
        url = event.payload?.issue?.html_url ?? url
      } else if (type === 'PullRequestEvent') {
        const action = event.payload?.action ?? 'opened'
        const prNumber = event.payload?.pull_request?.number ?? ''
        const readable =
          action === 'opened'
            ? '创建了 PR'
            : action === 'closed'
              ? '合并/关闭 PR'
              : '更新了 PR'
        title = `${readable} #${prNumber}`
        url = event.payload?.pull_request?.html_url ?? url
      } else if (type === 'CreateEvent') {
        const refType = event.payload?.ref_type ?? 'repository'
        title = refType === 'repository' ? '创建了新仓库' : `创建了新的 ${refType}`
      } else if (type === 'WatchEvent') {
        title = '关注了一个仓库'
      } else if (type === 'ReleaseEvent') {
        const tagName = event.payload?.release?.tag_name ?? ''
        title = `发布了版本 ${tagName}`
        url = event.payload?.release?.html_url ?? url
      }

      return {
        id: `github-${event.id}`,
        source: 'github',
        title,
        subtitle,
        url,
        timestamp: createdAt
      }
    })

    githubActivities.value = mapped
  } catch (error: unknown) {
    githubError.value = error instanceof Error ? error.message : '无法加载 GitHub 动态'
  } finally {
    githubLoading.value = false
  }
}

// 依次尝试多个 URL，直到成功获取文本（方便 RSS 镜像或本地兜底）。
async function fetchTextWithFallback(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (!response.ok) continue
      return await response.text()
    } catch {
      // 失败则继续尝试下一个候选链接
    }
  }
  return null
}

function decodeHtml(input: string): string {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = input
  return textarea.value
}

// 请求官方 Blog RSS（https://blog.fengying.xin/feed）并转换为活动卡片。
async function fetchBlogFeed() {
  blogLoading.value = true
  blogError.value = null
  try {
    const text = await fetchTextWithFallback([BLOG_FEED_ENDPOINT, BLOG_FEED_FALLBACK])
    if (!text) {
      throw new Error('无法获取 RSS 数据')
    }
    const parser = new DOMParser()
    const xml = parser.parseFromString(text, 'application/xml')
    const items = Array.from(xml.querySelectorAll('item')).slice(0, 30)
    const mapped: ActivityItem[] = items.map((item, index) => {
      const titleNode = item.querySelector('title')
      const linkNode = item.querySelector('link')
      const dateNode = item.querySelector('pubDate')
      const title = decodeHtml(titleNode?.textContent?.trim() ?? 'Blog 更新')
      const url = linkNode?.textContent?.trim() || 'https://blog.fengying.xin/'
      const timestamp = dateNode?.textContent
        ? new Date(dateNode.textContent).toISOString()
        : new Date().toISOString()

      return {
        id: `blog-${index}-${url}`,
        source: 'blog',
        title,
        subtitle: 'Blog · blog.fengying.xin',
        url,
        timestamp
      }
    })

    blogActivities.value = mapped
  } catch (error: unknown) {
    blogError.value = error instanceof Error ? error.message : '无法加载 Blog 动态'
  } finally {
    blogLoading.value = false
  }
}

onMounted(() => {
  void fetchGithubActivities()
  void fetchBlogFeed()
  startPointerTrail()
})

onBeforeUnmount(() => {
  stopPointerTrail()
})
</script>

<template>
  <div class="app-shell">
    <div class="app-bg">
      <div class="blob blob-main" />
      <div class="blob blob-accent" />
    </div>
    <div class="cursor-trail" aria-hidden="true">
      <span
        v-for="(point, index) in pointerTrail"
        :key="point.id"
        class="trail-dot"
        :style="{
          left: `${point.x}px`,
          top: `${point.y}px`,
          opacity: pointerTrailOpacity(index),
          transform: `translate(-50%, -50%) scale(${pointerTrailScale(index)})`
        }"
      />
    </div>
    <header class="hero-header">
      <div class="identity">
        <div class="identity-avatar">
          <img
            src="https://image.fengying.xin/Image%20hosting/%E7%94%98%E5%9F%8E%E5%8A%A8%E5%9B%BE.gif"
            alt="FengYing avatar"
          />
        </div>
        <div class="identity-text">
          <div class="identity-meta">
            <span class="identity-name">{{ displayName }}</span>
            <span class="identity-name-en">{{ displayNameEn }}</span>
          </div>
          <p class="identity-tagline">{{ tagline }}</p>
          <p class="identity-contact">
            <a :href="`mailto:admin@fengying.shop`">admin@fengying.shop</a> ·
            <a href="https://blog.fengying.xin/message" target="_blank" rel="noreferrer">去留言</a>
          </p>
          <div class="identity-stats">
            <span class="stat-chip">{{ activityCounter }}</span>
            <span class="stat-chip">{{ links.length }} 个指路标</span>
          </div>
        </div>
      </div>
    </header>

    <main class="page-main">
      <article class="hero-card">
        <div class="hero-card-bg">
          <img
            src="https://image.fengying.xin/Image%20hosting/%E9%80%82%E5%90%88%E5%BD%93%E8%83%8C%E6%99%AF%E7%9A%84%E7%94%98%E5%9F%8E.jpg"
            alt="City skyline background"
            loading="lazy"
          />
          <div class="hero-card-overlay" />
        </div>
        <div class="hero-card-content">
          <span class="hero-pill">FengYing Console</span>
          <h1>
            {{ displayName }}
            <span>/ {{ displayNameEn }}</span>
          </h1>
          <p class="hero-lead">
            你好呀，这里是枫莹，这里是主页面哦，可以在指路标里面看到很多其他的风景喵~
          </p>
          <ul class="hero-tags">
            <li v-for="tag in heroTags" :key="tag">{{ tag }}</li>
          </ul>
          <div class="hero-cta">
            <a class="btn primary" href="https://blog.fengying.xin/" target="_blank" rel="noreferrer">
              Blog
            </a>
            <a class="btn ghost" href="https://github.com/FengYing1314" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a class="btn ghost" href="https://blog.fengying.xin/message" target="_blank" rel="noreferrer">
              留言
            </a>
          </div>
          <div class="hero-card-footer">
            <div class="hero-music-player">
              <div class="music-now-playing">
                <div class="music-cover">
                  <img :src="currentTrack.cover" :alt="`${currentTrack.title} 封面`" loading="lazy" />
                </div>
                <div class="music-track-info">
                  <span class="music-track-label">正在播放</span>
                  <p class="music-track-title">{{ currentTrack.title }}</p>
                  <p class="music-track-artist">{{ currentTrack.artist }} · {{ currentTrack.mood }}</p>
                </div>
                <button class="music-play-toggle" type="button" @click="togglePlayback">
                  <svg
                    v-if="!isPlaying"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M8.5 5.5v13l9.5-6.5-9.5-6.5z"
                      opacity="0.9"
                    />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    aria-hidden="true"
                  >
                    <path fill="currentColor" d="M8 6h3v12H8zm5 0h3v12h-3z" opacity="0.9" />
                  </svg>
                  <span>{{ isPlaying ? '暂停' : '播放' }}</span>
                </button>
              </div>
              <div class="music-progress">
                <div class="music-progress-track">
                  <div class="music-progress-fill" :style="{ width: `${progressPercent}%` }" />
                  <input
                    type="range"
                    min="0"
                    :max="trackDuration || 0"
                    step="1"
                    :value="trackProgress"
                    :disabled="!trackDuration"
                    @input="handleSeekInput"
                  />
                </div>
                <div class="music-progress-times">
                  <span>{{ formatPlayerTime(trackProgress) }}</span>
                  <span>{{ trackDuration ? formatPlayerTime(trackDuration) : currentTrack.length }}</span>
                </div>
              </div>
              <div class="music-transport">
                <button
                  class="transport-btn"
                  type="button"
                  @click="playPreviousTrack"
                  aria-label="上一首"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M7 6h2v12H7zm3 6 7 6V6l-7 6z"
                    />
                  </svg>
                </button>
                <button
                  class="transport-btn transport-btn--ghost"
                  type="button"
                  @click="playNextTrack"
                  aria-label="下一首"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M17 6h-2v12h2zm-3 6-7 6V6l7 6z"
                    />
                  </svg>
                </button>
              </div>
              <div class="music-list">
                <button
                  v-for="(track, index) in featuredTracks"
                  :key="track.id"
                  type="button"
                  class="music-list-item"
                  :class="{ active: track.id === currentTrack.id }"
                  @click="selectTrack(index)"
                >
                  <div class="music-item-meta">
                    <span class="music-item-order">#{{ (index + 1).toString().padStart(2, '0') }}</span>
                    <div class="music-item-titles">
                      <span class="music-item-title">{{ track.title }}</span>
                      <span class="music-item-artist">{{ track.artist }}</span>
                    </div>
                  </div>
                  <span class="music-item-length">{{ track.length }}</span>
                </button>
              </div>
              <audio
                ref="audioRef"
                class="music-audio"
                :src="currentTrack.url"
                preload="metadata"
                @timeupdate="handleAudioTimeUpdate"
                @loadedmetadata="handleAudioLoaded"
                @ended="handleTrackEnded"
                @play="handleAudioPlay"
                @pause="handleAudioPause"
              />
            </div>
          </div>
        </div>
      </article>

      <article class="links-card hero-links-card">
        <p class="section-counter">{{ links.length }} 个指路标</p>
        <h2 class="section-title">我的指路标</h2>
        <p class="section-subtitle">都是关于咱的站点哦~点开就能去详情惹~</p>
        <div class="link-grid">
          <button
            v-for="link in links"
            :key="link.id"
            type="button"
            class="link-card"
            @click="openLink(link.url)"
          >
            <div class="link-thumb">
              <img :src="link.ogImage" :alt="`${link.label} 预览`" loading="lazy" />
            </div>
            <div class="link-content">
              <div class="link-title-row">
                <span class="link-title">{{ link.label }}</span>
                <span v-if="link.badge" class="link-badge">{{ link.badge }}</span>
              </div>
              <p class="link-description">{{ link.description }}</p>
              <span class="link-url">{{ formatHostname(link.url) }}</span>
            </div>
          </button>
        </div>
      </article>

      <article class="heatmap-card">
        <p class="section-counter">{{ activityCounter }}</p>
        <div class="section-header">
          <h2 class="section-title">贡献热力图</h2>
          <p class="section-subtitle">过去 {{ TOTAL_WEEKS }} 周使用代码体温，颜色告诉你忙没忙。</p>
        </div>
        <div class="heatmap-body">
          <div class="heatmap-grid" :style="heatmapGridStyle">
            <span
              v-for="(cell, index) in heatmapCells"
              :key="`${cell.date}-${index}`"
              class="heatmap-cell"
              :class="heatmapLevel(cell.count)"
              :title="describeHeatmapCell(cell)"
            >
              <span class="heatmap-tooltip">{{ describeHeatmapCell(cell) }}</span>
            </span>
          </div>
        </div>
        <div class="heatmap-legend">
          <span>少</span>
          <div class="legend-samples">
            <span class="legend-swatch level-0" />
            <span class="legend-swatch level-1" />
            <span class="legend-swatch level-2" />
            <span class="legend-swatch level-3" />
          </div>
          <span>多</span>
        </div>
      </article>

      <article class="activity-card">
        <p class="section-counter">{{ activityCounter }}</p>
        <div class="section-header">
          <h2 class="section-title">最近活动</h2>
          <p class="section-subtitle">GitHub + Blog 的活动记录呐，上下滑就能看到这一年的小冒泡。</p>
        </div>
        <div class="activity-status">
          <span v-if="githubLoading || blogLoading" class="status-pill">同步中...</span>
          <span v-else-if="!activityItems.length" class="status-pill status-muted">这会儿在休息</span>
        </div>
        <div class="activity-list music-list" role="list">
          <a
            v-for="(item, index) in activityItems"
            :key="item.id"
            class="music-list-item activity-entry"
            role="listitem"
            :href="item.url"
            target="_blank"
            rel="noreferrer"
          >
            <div class="music-item-meta">
              <span class="music-item-order">#{{ (index + 1).toString().padStart(2, '0') }}</span>
              <div class="music-item-titles">
                <span class="music-item-title">{{ item.title }}</span>
                <span class="music-item-artist">{{ item.subtitle }}</span>
              </div>
            </div>
            <div class="activity-entry-meta">
              <span class="activity-entry-source">{{ item.source === 'github' ? 'GitHub' : 'Blog' }}</span>
              <span class="activity-entry-date">{{ formatDisplayTime(item.timestamp) }}</span>
            </div>
          </a>
        </div>
        <div v-if="githubError || blogError" class="activity-errors">
          <p v-if="githubError" class="error-text">GitHub：{{ githubError }}</p>
          <p v-if="blogError" class="error-text">Blog：{{ blogError }}</p>
        </div>
      </article>
    </main>

    <footer class="page-footer">
      <p class="footer-text">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">湘ICP备2025137354号-1</a>
      </p>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
  padding: 36px 42px 64px;
  background-color: var(--bg-base);
  color: var(--fg-primary);
  overflow-x: hidden;
}

.app-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.cursor-trail {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 6;
}

.trail-dot {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.85), rgba(56, 189, 248, 0));
  box-shadow: 0 0 24px rgba(56, 189, 248, 0.35);
  transform-origin: center;
  will-change: transform, opacity;
  transition: opacity 0.2s linear, transform 0.2s ease-out;
  filter: blur(0.2px);
}

.blob {
  position: absolute;
  border-radius: 999px;
  filter: blur(80px);
  opacity: 0.65;
}

.blob-main {
  width: 520px;
  height: 520px;
  top: -180px;
  right: -140px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.8), transparent 70%);
}

.blob-accent {
  width: 460px;
  height: 460px;
  bottom: -200px;
  left: -160px;
  background: radial-gradient(circle, rgba(244, 114, 182, 0.7), transparent 70%);
}

.hero-header {
  position: relative;
  z-index: 1;
  margin-bottom: 28px;
}

.identity {
  display: flex;
  align-items: center;
  gap: 18px;
}

.identity-avatar {
  width: 80px;
  height: 80px;
  border-radius: 28px;
  padding: 5px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.9), rgba(244, 114, 182, 0.9));
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
}

.identity-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 22px;
  object-fit: cover;
  display: block;
}

.identity-meta {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.identity-name {
  font-size: 30px;
  font-weight: 600;
}

.identity-name-en {
  font-size: 16px;
  color: var(--fg-muted);
  letter-spacing: 0.12em;
}

.identity-tagline {
  margin: 4px 0;
  font-size: 15px;
  color: var(--fg-secondary);
}

.identity-contact {
  margin: 0;
  font-size: 13px;
  color: var(--fg-secondary);
}

.identity-contact a {
  color: var(--fg-primary);
  text-decoration: underline;
}

.identity-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  font-size: 12px;
  color: var(--fg-muted);
  white-space: nowrap;
}

.page-main {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  grid-template-rows: minmax(60vh, auto);
  grid-auto-rows: minmax(360px, auto);
  gap: 24px;
}

.hero-card {
  position: relative;
  border-radius: 32px;
  overflow: hidden;
  background: rgba(2, 6, 23, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.4);
  box-shadow: 0 30px 80px rgba(2, 6, 23, 0.9);
  display: flex;
  height: 100%;
  min-height: 60vh;
}

.hero-card-bg {
  position: absolute;
  inset: 0;
}

.hero-card-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.32;
  filter: grayscale(30%);
}

.hero-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(150deg, rgba(2, 6, 23, 0.95), rgba(2, 6, 23, 0.6));
}

.hero-card-content {
  position: relative;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex: 1 1 auto;
  min-height: 0;
}

.hero-card-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.hero-card-content h1 {
  margin: 0;
  font-size: 40px;
  line-height: 1.2;
}

.hero-card-content h1 span {
  font-size: 18px;
  letter-spacing: 0.16em;
  color: var(--fg-muted);
}

.hero-lead {
  margin: 0;
  font-size: 16px;
  color: var(--fg-secondary);
}

.hero-tags {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-tags li {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  font-size: 13px;
}

.hero-music-player {
  border-radius: 20px;
  border: 1px solid rgba(56, 189, 248, 0.25);
  background: 
    linear-gradient(
      135deg,
      rgba(2, 6, 23, 0.95) 0%,
      rgba(15, 23, 42, 0.9) 50%,
      rgba(30, 41, 59, 0.85) 100%
    ),
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(56, 189, 248, 0.02) 10px,
      rgba(56, 189, 248, 0.02) 20px
    );
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 
    inset 0 0 30px rgba(15, 23, 42, 0.4),
    0 8px 24px rgba(14, 165, 233, 0.1),
    0 16px 40px rgba(2, 6, 23, 0.6);
  backdrop-filter: blur(16px);
  width: 100%;
  max-width: 90%;
  min-width: 0;
  position: relative;
  overflow: hidden;
}

.hero-music-player::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(56, 189, 248, 0.5) 50%,
    transparent
  );
  opacity: 0.4;
}

.music-now-playing {
  display: flex;
  align-items: center;
  gap: 12px;
}

.music-cover {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  padding: 2px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.7), rgba(244, 114, 182, 0.7));
  flex-shrink: 0;
  box-shadow: 
    0 8px 20px rgba(14, 165, 233, 0.2),
    0 0 12px rgba(56, 189, 248, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.music-cover:hover {
  transform: scale(1.05);
  box-shadow: 
    0 12px 28px rgba(14, 165, 233, 0.3),
    0 0 20px rgba(56, 189, 248, 0.2);
}

.music-cover img {
  width: 100%;
  height: 100%;
  border-radius: 15px;
  object-fit: cover;
  display: block;
}

.music-track-info {
  flex: 1;
  min-width: 0;
}

.music-track-label {
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--fg-muted);
}

.music-track-title {
  margin: 2px 0 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--fg-primary);
}

.music-track-artist {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--fg-secondary);
}

.music-play-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.6);
  padding: 8px 16px;
  background: linear-gradient(
    135deg,
    rgba(14, 165, 233, 0.15),
    rgba(56, 189, 248, 0.08)
  );
  color: var(--accent-strong);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.music-play-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 18px rgba(14, 165, 233, 0.25),
    0 0 10px rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.8);
  background: linear-gradient(
    135deg,
    rgba(14, 165, 233, 0.2),
    rgba(56, 189, 248, 0.12)
  );
}

.music-play-toggle:active {
  transform: translateY(0);
}

.music-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.music-progress-track {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.25);
  overflow: visible;
  padding: 6px 0;
}

.music-progress-fill {
  position: absolute;
  top: 6px;
  left: 0;
  bottom: 6px;
  width: 0;
  background: linear-gradient(
    90deg,
    rgba(56, 189, 248, 0.9) 0%,
    rgba(168, 85, 247, 0.85) 50%,
    rgba(244, 114, 182, 0.9) 100%
  );
  border-radius: 999px;
  pointer-events: none;
  transition: width 0.15s linear;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.3);
}

.music-progress input[type='range'] {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  margin: 0;
  width: 100%;
  background: transparent;
  appearance: none;
  height: 24px;
  cursor: pointer;
  z-index: 2;
}

.music-progress input[type='range']:disabled {
  cursor: not-allowed;
}

.music-progress input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #fff;
  border: 3px solid var(--accent-strong);
  box-shadow: 0 4px 10px rgba(14, 165, 233, 0.35);
}

.music-progress input[type='range']::-webkit-slider-runnable-track {
  background: transparent;
}

.music-progress input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #fff;
  border: 3px solid var(--accent-strong);
  box-shadow: 0 4px 10px rgba(14, 165, 233, 0.35);
}

.music-progress input[type='range']::-moz-range-track {
  background: transparent;
}

.music-progress-times {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--fg-muted);
}

.music-transport {
  display: flex;
  gap: 10px;
}

.transport-btn {
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(15, 23, 42, 0.7);
  color: var(--fg-primary);
  border-radius: 14px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.transport-btn--ghost {
  border-color: rgba(244, 114, 182, 0.5);
}

.transport-btn:hover {
  border-color: var(--accent-strong);
  background: rgba(14, 165, 233, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(14, 165, 233, 0.2);
}

.transport-btn--ghost:hover {
  border-color: rgba(244, 114, 182, 0.8);
  background: rgba(244, 114, 182, 0.08);
  box-shadow: 0 6px 12px rgba(244, 114, 182, 0.2);
}

.music-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 80px;
  overflow-y: auto;
  padding-right: 4px;
}

.music-list::-webkit-scrollbar {
  width: 4px;
}

.music-list::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.4);
  border-radius: 999px;
}

.music-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px;
  border: 1px solid rgba(51, 65, 85, 0.8);
  padding: 7px 12px;
  background: rgba(2, 6, 23, 0.6);
  gap: 10px;
  cursor: pointer;
  transition: border-color 120ms ease, transform 120ms ease;
}

.music-list-item.active {
  border-color: var(--accent-strong);
  background: linear-gradient(
    135deg,
    rgba(14, 165, 233, 0.1),
    rgba(56, 189, 248, 0.06)
  );
  transform: translateX(3px);
  box-shadow: 0 3px 8px rgba(14, 165, 233, 0.15);
}

.music-item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.music-item-order {
  font-size: 12px;
  color: var(--fg-muted);
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.music-item-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.music-item-title {
  font-size: 14px;
  color: var(--fg-primary);
}

.music-item-artist {
  font-size: 12px;
  color: var(--fg-secondary);
}

.music-item-length {
  font-size: 12px;
  color: var(--fg-muted);
}

.music-audio {
  display: none;
}

.hero-cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-top: 8px;
}

.btn {
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.btn.primary {
  background: var(--accent-strong);
  color: #020617;
  box-shadow: 0 16px 30px rgba(14, 165, 233, 0.45);
}

.btn.ghost {
  border-color: rgba(148, 163, 184, 0.35);
  color: var(--fg-primary);
  background: transparent;
}

.btn:hover {
  transform: translateY(-2px);
}

.links-card,
.heatmap-card,
.activity-card {
  border-radius: 28px;
  padding: 24px;
  background: rgba(10, 15, 32, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.45);
  box-shadow: 0 26px 70px rgba(2, 6, 23, 0.95);
  display: flex;
  flex-direction: column;
}

.hero-links-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: stretch;
}

.section-counter {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  font-size: 12px;
  color: var(--fg-muted);
  white-space: nowrap;
}

.section-title {
  margin: 6px 0 0;
  font-size: 18px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.section-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--fg-secondary);
}

.link-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
}

.link-card {
  border-radius: 20px;
  border: 1px solid rgba(51, 65, 85, 0.8);
  background: rgba(2, 6, 23, 0.4);
  padding: 12px;
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease;
}

.link-card:hover {
  border-color: rgba(148, 163, 184, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 18px 38px rgba(2, 6, 23, 0.85);
}

.link-thumb {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.8);
  flex-shrink: 0;
}

.link-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.link-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.link-title-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.link-title {
  font-size: 15px;
  font-weight: 600;
}

.link-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(244, 114, 182, 0.25);
  border: 1px solid rgba(244, 114, 182, 0.6);
}

.link-description {
  margin: 0;
  font-size: 13px;
  color: var(--fg-secondary);
}

.link-url {
  font-size: 12px;
  color: var(--fg-muted);
}

.heatmap-card,
.activity-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 360px;
  height: 100%;
}

.heatmap-card {
  --heatmap-cell-size: 18px;
  --heatmap-cell-gap: 3px;
  --heatmap-columns: 20;
  --heatmap-rows: 7;
  max-height: 540px;
}

.activity-card {
  max-height: 540px;
  overflow: hidden;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.heatmap-body {
  display: flex;
  justify-content: flex-start;
  max-width: 100%;
  overflow-x: auto;
}

.heatmap-grid {
  display: inline-grid;
  grid-auto-flow: row;
  grid-template-columns: repeat(var(--heatmap-columns), var(--heatmap-cell-size));
  grid-template-rows: repeat(var(--heatmap-rows), var(--heatmap-cell-size));
  gap: var(--heatmap-cell-gap);
  width: auto;
  margin: 0;
  padding: calc(var(--heatmap-cell-size) / 2);
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 18px;
  background: rgba(2, 6, 23, 0.6);
  box-shadow: inset 0 0 20px rgba(15, 23, 42, 0.5);
}

.heatmap-cell {
  width: var(--heatmap-cell-size);
  height: var(--heatmap-cell-size);
  border-radius: 3px;
  position: relative;
  background-color: rgba(15, 23, 42, 1);
  overflow: visible;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-sizing: border-box;
}

.heatmap-cell.level-0 {
  background-color: rgba(30, 41, 59, 1);
}

.heatmap-cell.level-1 {
  background-color: rgba(56, 189, 248, 0.5);
}

.heatmap-cell.level-2 {
  background-color: rgba(56, 189, 248, 0.9);
}

.heatmap-cell.level-3 {
  background: linear-gradient(135deg, #22c55e, #f97316);
}

.heatmap-tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translate(-50%, 0);
  white-space: nowrap;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(2, 6, 23, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.4);
  font-size: 11px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 5;
}

.heatmap-cell:hover .heatmap-tooltip {
  opacity: 1;
  transform: translate(-50%, -4px);
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--fg-muted);
}

.legend-samples {
  display: flex;
  gap: 4px;
}

.legend-swatch {
  width: 20px;
  height: 10px;
  border-radius: 999px;
}

.legend-swatch.level-0 {
  background-color: rgba(30, 41, 59, 1);
}

.legend-swatch.level-1 {
  background-color: rgba(56, 189, 248, 0.5);
}

.legend-swatch.level-2 {
  background-color: rgba(56, 189, 248, 0.9);
}

.legend-swatch.level-3 {
  background: linear-gradient(135deg, #22c55e, #f97316);
}

.activity-status {
  min-height: 24px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(2, 6, 23, 0.9);
}

.status-pill.status-muted {
  border-style: dashed;
  color: var(--fg-muted);
}

.activity-list {
  padding: 0 4px 0 0;
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  gap: 16px;
}

.activity-entry {
  text-decoration: none;
  color: inherit;
}

.activity-entry-source {
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: var(--accent-strong);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.error-text {
  margin: 0;
}

@keyframes floatCard {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
  100% {
    transform: translateY(0);
  }
}

.hero-card,
.links-card,
.heatmap-card,
.activity-card {
  animation: floatCard 16s ease-in-out infinite;
}

.links-card {
  animation-delay: 2s;
}

.heatmap-card {
  animation-delay: 4s;
}

.activity-card {
  animation-delay: 6s;
}

.page-footer {
  position: relative;
  z-index: 1;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 13px;
  color: var(--fg-muted);
}

.footer-text a {
  color: var(--fg-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-text a:hover {
  color: var(--fg-primary);
}

@media (max-width: 1200px) {
  .page-main {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(60vh, auto);
  }
}

@media (max-width: 720px) {
  .app-shell {
    padding: 24px 18px 48px;
  }

  .page-main {
    grid-auto-rows: minmax(0, auto);
    gap: 18px;
  }

  .hero-card {
    min-height: auto;
    border-radius: 24px;
  }

  .identity {
    flex-direction: column;
    align-items: flex-start;
  }

  .identity-name {
    font-size: 24px;
  }

  .link-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-music-player {
    padding: 14px;
    max-width: 100%;
  }

  .music-now-playing {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .music-track-info {
    width: 100%;
  }

  .music-play-toggle {
    align-self: center;
  }

  .music-list {
    max-height: none;
  }

  .heatmap-card {
    --heatmap-cell-size: 12px;
    --heatmap-cell-gap: 2px;
  }

  .heatmap-body {
    gap: 10px;
    overflow-x: auto;
  }

  .heatmap-grid {
    width: max(320px, 100%);
    min-width: 320px;
  }

  .heatmap-cell {
    border-radius: 2px;
  }

  .heatmap-legend {
    font-size: 11px;
    gap: 8px;
  }

  .legend-swatch {
    width: 16px;
    height: 8px;
  }

}

.link-grid,
.activity-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(56, 189, 248, 0.5) rgba(15, 23, 42, 0.3);
}

.link-grid::-webkit-scrollbar,
.activity-list::-webkit-scrollbar {
  width: 8px;
}

.link-grid::-webkit-scrollbar-track,
.activity-list::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.3);
  border-radius: 10px;
  margin: 4px 0;
}

.link-grid::-webkit-scrollbar-thumb,
.activity-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.6), rgba(244, 114, 182, 0.6));
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: background 0.2s ease;
}

.link-grid::-webkit-scrollbar-thumb:hover,
.activity-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.9), rgba(244, 114, 182, 0.9));
  background-clip: padding-box;
}
</style>
