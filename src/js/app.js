/**
 * @property {HTMLInputElement} input
 * @property {SpotlightItem[]} items
 * @property {SpotlightItem[]} matchedItems
 * @property {SpotlightItem} activeItem
 * @property {HTMLUListElement} suggestions
 */
class Spotlight extends HTMLElement {
    constructor () {
        super();
        this.shortcutHandler = this.shortcutHandler.bind(this)
        this.hide = this.hide.bind(this)
        this.onInput = this.onInput.bind(this)
        this.inputShortcutHandler = this.inputShortcutHandler.bind(this)
    }

    connectedCallback () {
        this.classList.add('spotlight')
        this.innerHTML = `
        <div class="spotlight-bar">
            <input type="text">
            <ul class="spotlight-suggestions" hidden>
            </ul>
        </div>
        `
        this.input = this.querySelector('input')
        this.input.addEventListener('blur', this.hide)

        this.suggestions = this.querySelector('.spotlight-suggestions')
        this.items = Array.from(document.querySelectorAll(this.getAttribute('target'))).map(a => {
            const title = a.innerText.trim()
            if (title === '') {
                return null;
            }
            const item = new SpotlightItem(title, a.getAttribute('href'))
            this.suggestions.appendChild(item.element)
            return item
        }).filter(i => i !== null)

        window.addEventListener('keydown', this.shortcutHandler)
        this.input.addEventListener('input', this.onInput)
        this.input.addEventListener('keydown', this.inputShortcutHandler)
    }

    disconnectedCallback () {
        window.removeEventListener('keydown', this.shortcutHandler)
    }

    shortcutHandler (e) {
        if (e.key === 'k' && e.ctrlKey === true) {
            e.preventDefault()
            this.classList.add('active')
            this.input.value = ''
            this.onInput()
            this.input.focus()
        }
    }

    hide () {
        this.classList.remove('active')
    }

    onInput () {
        const search = this.input.value.trim()
        if (search === '') {
            this.items.forEach(item => item.hide())
            this.matchedItems = []
            this.suggestions.setAttribute('hidden', 'hidden')
            return
        }
        let regexp = '^(.*)'
        for(const i in search) {
            regexp += `(${search[i]})(.*)`
        }
        regexp += '$'
        regexp = new RegExp(regexp, 'i')
        this.matchedItems = this.items.filter(item => item.match(regexp))
        if (this.matchedItems.length > 0) {
            this.suggestions.removeAttribute('hidden')
            this.setActiveIndex(0)
        } else {
            this.suggestions.setAttribute('hidden', 'hidden')
        }
    }

    /**
     * @param {number} n
     */
    setActiveIndex (n) {
        if (this.activeItem) {
            this.activeItem.unselect()
        }
        if (n >= this.matchedItems.length) {
            n = 0
        }
        if (n < 0) {
            n = this.matchedItems.length - 1
        }
        this.matchedItems[n].select()
        this.activeItem = this.matchedItems[n]
    }

    /**
     * @param {KeyboardEvent} e
     */
    inputShortcutHandler (e) {
        if (e.key === 'Escape') {
            this.input.blur()
        } else if (e.key === 'ArrowDown') {
            const index = this.matchedItems.findIndex(element => element === this.activeItem)
            this.setActiveIndex(index + 1)
        } else if (e.key === 'ArrowUp') {
            const index = this.matchedItems.findIndex(element => element === this.activeItem)
            this.setActiveIndex(index - 1)
        } else if (e.key === 'Enter') {
            this.activeItem.follow()
        }
    }
}

/**
 * @property {HTMLLIElement} element
 * @property {string} title
 * @property {string} href
 */
class SpotlightItem {
    /**
     * @param {string} title
     * @param {string} href
     */
    constructor (title, href) {
        const li = document.createElement('li')
        const a = document.createElement('a')
        a.setAttribute('href', href)
        a.innerText = title
        li.appendChild(a)
        this.element = li
        this.title = title
        this.href = href
        this.hide()
    }

    /**
     * @param {RegExp} regexp
     * @return {boolean}
     */
    match (regexp) {
        const matches = this.title.match(regexp)
        if (matches === null) {
            this.hide()
            return false
        }
        this.element.firstElementChild.innerHTML = matches.reduce((acc, match, index) => {
            if (index === 0) {
                return acc;
            }
            return acc + (index % 2 === 0 ? `<mark>${match}</mark>` : match)
        }, '')
        this.element.removeAttribute('hidden')
        return true;
    }

    hide () {
        this.element.setAttribute('hidden', 'hidden')
    }

    select () {
        this.element.classList.add('active')
    }

    unselect () {
        this.element.classList.remove('active')
    }

    follow () {
        window.location.href = this.href
    }
}

customElements.define('spotlight-bar', Spotlight)
