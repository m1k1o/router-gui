const scrollToBottom = (el, smooth) => {
    if (typeof el.scroll === "function") {
        el.scroll({
            top: el.scrollHeight,
            behavior: smooth ? 'smooth' : 'instant'
        });
    } else {
        el.scrollTop = el.scrollHeight;
    }
};

Vue.directive('auto-scroll', {
    bind: (el, binding) => {
        let scrolled = false;

        el.addEventListener('scroll', e => {
            scrolled = el.scrollTop + el.clientHeight + 1 < el.scrollHeight;
        });

        (new MutationObserver(e => {
            let config = binding.value || {};
            let pause = config.always === false && scrolled;
            if (config.scrollonremoved) {
                if (pause || e[e.length - 1].addedNodes.length != 1 && e[e.length - 1].removedNodes.length != 1) return;
            } else {
                if (pause || e[e.length - 1].addedNodes.length != 1) return;
            }
            scrollToBottom(el, config.smooth);
        })).observe(el, { childList: true, subtree: true });
    },
    inserted: scrollToBottom
})