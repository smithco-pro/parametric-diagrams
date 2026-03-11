<script setup>
import DefaultTheme from 'vitepress/theme'
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'

const { Layout } = DefaultTheme
const { site } = useData()
const route = useRoute()

const base = computed(() => site.value.base)

const mainSiteRoot = computed(() => {
  if (import.meta.env.DEV) {
    return 'http://localhost:5173' + base.value.replace(/docs\/$/, '')
  }
  return base.value.replace(/docs\/$/, '')
})

const diagramsLink = computed(() => mainSiteRoot.value)
const aboutLink = computed(() => mainSiteRoot.value + 'about')

const docSections = computed(() => [
  { text: 'Guide', link: base.value + 'guide/getting-started.html', match: '/guide/' },
  { text: 'Reference', link: base.value + 'reference/mmdx-format.html', match: '/reference/' },
  { text: 'Architecture', link: base.value + 'architecture/overview.html', match: '/architecture/' },
])

const isActiveSection = (match) => {
  return route.path.includes(match)
}

// Force full-page navigation to bypass VitePress's SPA router
const navigate = (url) => {
  window.location.href = url
}
</script>

<template>
  <Layout>
    <template #layout-top>
      <div class="nav-wrapper">
      <div class="site-top-nav">
        <span class="nav-brand">&#x1f5a7; Parametric Diagrams</span>
        <div class="nav-docs">
          <a
            v-for="section in docSections"
            :key="section.text"
            :href="section.link"
            :class="{ 'active-section': isActiveSection(section.match) }"
          >{{ section.text }}</a>
        </div>
        <div class="nav-links">
          <a :href="diagramsLink" @click.prevent="navigate(diagramsLink)">Diagrams</a>
          <a href="javascript:void(0)" class="active">Docs</a>
          <a :href="aboutLink" @click.prevent="navigate(aboutLink)">About Me</a>
        </div>
      </div>
      </div>
    </template>
  </Layout>
</template>
