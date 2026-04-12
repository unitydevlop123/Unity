
export const categoryExclusions: Record<string, (title: string, channel: string) => boolean> = {
  'chinese_anime': (title: string, channel: string) => {
    const lowerTitle = title.toLowerCase();
    return lowerTitle.includes('japanese') || lowerTitle.includes('movie') || lowerTitle.includes('live action') || lowerTitle.includes('live-action') || lowerTitle.includes('korean') || lowerTitle.includes('hollywood') || lowerTitle.includes('drama');
  },
  'nigerian_drama': (title: string, channel: string) => {
    const lowerTitle = title.toLowerCase();
    return lowerTitle.includes('ghana') || lowerTitle.includes('hollywood') || lowerTitle.includes('bollywood') || lowerTitle.includes('music') || lowerTitle.includes('song') || lowerTitle.includes('comedy skit') || lowerTitle.includes('korean') || lowerTitle.includes('chinese') || lowerTitle.includes('american') || lowerTitle.includes('anime') || lowerTitle.includes('donghua') || lowerTitle.includes('arabic') || lowerTitle.includes('arab') || lowerTitle.includes('islamic') || lowerTitle.includes('egypt') || /[\u0600-\u06FF]/.test(title);
  },
  'gaming': (title: string, channel: string) => {
    const lowerTitle = title.toLowerCase();
    return lowerTitle.includes('movie') || lowerTitle.includes('music') || lowerTitle.includes('indie') || lowerTitle.includes('retro') || lowerTitle.includes('trailer');
  },
  'korean_drama': (title: string, channel: string) => {
    const lowerTitle = title.toLowerCase();
    return lowerTitle.includes('chinese') || lowerTitle.includes('japanese') || lowerTitle.includes('anime') || lowerTitle.includes('thai') || lowerTitle.includes('music') || lowerTitle.includes('song');
  },
  'martial_arts': (title: string, channel: string) => {
    const lowerTitle = title.toLowerCase();
    const lowerChannel = channel ? channel.toLowerCase() : '';
    
    if (lowerChannel.includes('all keys donghua')) return true;
    if (lowerTitle.includes('apotheosis')) return true;

    return lowerTitle.includes('anime') || lowerTitle.includes('donghua') || lowerTitle.includes('animation') || lowerTitle.includes('cartoon') || lowerTitle.includes('3d anime') || lowerTitle.includes('shrouding the heavens') || lowerTitle.includes('shrounding the heavens') || lowerTitle.includes('korean') || lowerTitle.includes('kdrama') || lowerTitle.includes('k-drama') || lowerTitle.includes('thai') || lowerTitle.includes('thailand') || lowerTitle.includes('japan') || lowerTitle.includes('hindi') || lowerTitle.includes('dubbed in hindi');
  },
  'music': (title: string, channel: string) => {
    const lowerTitle = title.toLowerCase();
    return lowerTitle.includes('movie') || lowerTitle.includes('gameplay') || lowerTitle.includes('drama') || lowerTitle.includes('episode') || lowerTitle.includes('trailer');
  },
  'superhero': (title: string, channel: string) => {
    const lowerTitle = title.toLowerCase();
    return lowerTitle.includes('donghua') || lowerTitle.includes('chinese anime') || lowerTitle.includes('soul land') || lowerTitle.includes('throne of seal') || lowerTitle.includes('perfect world') || lowerTitle.includes('shrouding the heavens') || lowerTitle.includes('shrounding the heavens') || lowerTitle.includes('gameplay') || lowerTitle.includes('walkthrough') || lowerTitle.includes('music') || lowerTitle.includes('song') || lowerTitle.includes('anime');
  },
  'american_movies': (title: string, channel: string) => {
    const lowerTitle = title.toLowerCase();
    return lowerTitle.includes('chinese') || lowerTitle.includes('korean') || lowerTitle.includes('nigerian') || lowerTitle.includes('nollywood') || lowerTitle.includes('anime') || lowerTitle.includes('donghua') || lowerTitle.includes('kdrama');
  }
};

export const categoryFilters: Record<string, (title: string, channel: string) => boolean> = {
  chinese_anime: (title: string) => {
    const isChineseAnime = title.toLowerCase().includes('donghua') || (title.toLowerCase().includes('chinese') && title.toLowerCase().includes('anime')) || title.toLowerCase().includes('throne of seal') || title.toLowerCase().includes('soul land') || title.toLowerCase().includes('perfect world');
    const isExcluded = title.toLowerCase().includes('japanese') || title.toLowerCase().includes('movie') || title.toLowerCase().includes('live action') || title.toLowerCase().includes('live-action') || title.toLowerCase().includes('korean') || title.toLowerCase().includes('hollywood') || title.toLowerCase().includes('drama');
    return isChineseAnime && !isExcluded;
  },
  nigerian_drama: (title: string) => {
    const lowerTitle = title.toLowerCase();
    const isNigerian = lowerTitle.includes('nigeria') || lowerTitle.includes('nollywood') || lowerTitle.includes('yoruba') || lowerTitle.includes('igbo') || lowerTitle.includes('hausa') || lowerTitle.includes('nolly wood') || lowerTitle.includes('african movie');
    const isExcluded = lowerTitle.includes('ghana') || lowerTitle.includes('hollywood') || lowerTitle.includes('bollywood') || lowerTitle.includes('music') || lowerTitle.includes('song') || lowerTitle.includes('comedy skit') || lowerTitle.includes('korean') || lowerTitle.includes('chinese') || lowerTitle.includes('american') || lowerTitle.includes('anime') || lowerTitle.includes('donghua') || lowerTitle.includes('arabic') || lowerTitle.includes('arab') || lowerTitle.includes('islamic') || lowerTitle.includes('egypt') || /[\u0600-\u06FF]/.test(title);
    return isNigerian && !isExcluded;
  },
  gaming: (title: string) => {
    const isEsports = title.toLowerCase().includes('esport') || title.toLowerCase().includes('tournament') || title.toLowerCase().includes('competitive') || title.toLowerCase().includes('championship') || title.toLowerCase().includes('full match');
    const isExcluded = title.toLowerCase().includes('movie') || title.toLowerCase().includes('music') || title.toLowerCase().includes('indie') || title.toLowerCase().includes('retro') || title.toLowerCase().includes('trailer');
    return isEsports && !isExcluded;
  },
  korean_drama: (title: string) => {
    const isKorean = title.toLowerCase().includes('korean') || title.toLowerCase().includes('kdrama') || title.toLowerCase().includes('k-drama') || title.toLowerCase().includes('korea');
    const isExcluded = title.toLowerCase().includes('chinese') || title.toLowerCase().includes('japanese') || title.toLowerCase().includes('anime') || title.toLowerCase().includes('thai') || title.toLowerCase().includes('music') || title.toLowerCase().includes('song');
    return isKorean && !isExcluded;
  },
  martial_arts: (title: string, channel: string) => {
    const lowerTitle = title.toLowerCase();
    const lowerChannel = channel ? channel.toLowerCase() : '';
    const allowedChannels = ['kdeo', 'kisskh dramas unofficial', 'spiritpact tv hd'];
    const allowedTerms = ['wait! my secret lover is my', 'chinese martial arts wuxia'];
    
    if (allowedChannels.some(c => lowerChannel.includes(c))) return true;
    if (allowedTerms.some(t => lowerTitle.includes(t))) return true;

    // STRICT REJECTION OF ANIMATION
    if (lowerChannel.includes('donghua') || lowerChannel.includes('anime') || lowerChannel.includes('all keys donghua')) return false;
    if (lowerTitle.includes('apotheosis') || lowerTitle.includes('anime') || lowerTitle.includes('donghua') || lowerTitle.includes('animation') || lowerTitle.includes('cartoon') || lowerTitle.includes('3d anime') || lowerTitle.includes('shrouding the heavens') || lowerTitle.includes('shrounding the heavens')) return false;

    if (lowerTitle.includes('korean') || lowerTitle.includes('kdrama') || lowerTitle.includes('k-drama') || 
        lowerTitle.includes('thai') || lowerTitle.includes('thailand') || lowerTitle.includes('japan') || 
        lowerTitle.includes('hindi') || lowerTitle.includes('dubbed in hindi')) return false;

    const hasChineseKeyword = lowerTitle.includes('chinese') || lowerTitle.includes('china') || lowerTitle.includes('cdrama') || lowerTitle.includes('eng sub') || lowerTitle.includes('wuxia') || lowerTitle.includes('drama movie');
    const hasChineseChar = /[\u4e00-\u9fff]/.test(title);
    
    if (!hasChineseKeyword && !hasChineseChar) return false;

    return true;
  },
  music: (title: string) => {
    const isMusic = title.toLowerCase().includes('music video') || title.toLowerCase().includes('official video') || title.toLowerCase().includes('official music video') || title.toLowerCase().includes('ft') || title.toLowerCase().includes('feat');
    const isExcluded = title.toLowerCase().includes('movie') || title.toLowerCase().includes('gameplay') || title.toLowerCase().includes('drama') || title.toLowerCase().includes('episode') || title.toLowerCase().includes('trailer');
    return isMusic && !isExcluded;
  },
  superhero: (title: string) => {
    const lowerTitle = title.toLowerCase();
    
    // STRICT REJECTION OF CHINESE ANIME/DONGHUA
    if (lowerTitle.includes('donghua') || lowerTitle.includes('chinese anime') || lowerTitle.includes('soul land') || lowerTitle.includes('throne of seal') || lowerTitle.includes('perfect world') || lowerTitle.includes('shrouding the heavens') || lowerTitle.includes('shrounding the heavens')) return false;

    const heroKeywords = ['superhero', 'marvel', 'dc', 'avenger', 'batman', 'spider', 'superman', 'iron man', 'justice league', 'black panther', 'thor', 'captain america', 'hulk', 'x-men', 'wolverine', 'deadpool', 'wonder woman', 'aquaman', 'flash', 'guardians of the galaxy'];
    const isHero = heroKeywords.some(k => lowerTitle.includes(k));
    
    const isExcluded = lowerTitle.includes('gameplay') || lowerTitle.includes('walkthrough') || lowerTitle.includes('music') || lowerTitle.includes('song') || lowerTitle.includes('anime') || lowerTitle.includes('donghua');
    
    return isHero && !isExcluded;
  },
  american_movies: (title: string) => {
    const lowerTitle = title.toLowerCase();
    const isAmerican = lowerTitle.includes('hollywood') || lowerTitle.includes('american') || lowerTitle.includes('english movie') || lowerTitle.includes('western movie') || lowerTitle.includes('action movie');
    const isExcluded = lowerTitle.includes('chinese') || lowerTitle.includes('korean') || lowerTitle.includes('nigerian') || lowerTitle.includes('nollywood') || lowerTitle.includes('anime') || lowerTitle.includes('donghua') || lowerTitle.includes('kdrama');
    return isAmerican && !isExcluded;
  }
};
