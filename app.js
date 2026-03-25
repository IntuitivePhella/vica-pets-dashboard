(() => {
// Configuração do Supabase
const SUPABASE_URL = 'https://dwrtskjadoocdxojkrlu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cnRza2phZG9vY2R4b2prcmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3MDY2OTMsImV4cCI6MjA0OTI4MjY5M30.Ug5Efjr2kSdQyDyJoSKemCsWxRv0i3Ovf6PDOR3YCKE';

// Inicializar cliente Supabase com configurações adicionais
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// Estado da aplicação
let pets = [];
let realtimeChannel = null;

const IMAGE_PLACEHOLDER_URL = 'https://via.placeholder.com/300x200?text=Sem+Foto';
// Habilitando Netlify Image CDN como Proxy Proxy para mitigar Egress e Limits do Supabase.
const IMAGE_PROXY_BASE_URL = '/.netlify/images';
const TRACKED_STATUSES = new Set(['DISPONIVEL', 'EM_PROCESSO_ADOTIVO', 'ADOTADO']);
const TRANSFORM_QUERY_PARAMS = ['width', 'height', 'quality', 'resize', 'format', 'se'];

function applyImageProxy(url) {
    if (!IMAGE_PROXY_BASE_URL) return url;

    try {
        const parsed = new URL(url);
        // O Netlify Image CDN requer o URL como query param, ex: /.netlify/images?url=https...&w=400&q=80
        return `${IMAGE_PROXY_BASE_URL}?url=${encodeURIComponent(url)}&w=400&q=80`;
    } catch (_error) {
        return url;
    }
}

function isSupabaseStorageUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.hostname.endsWith('supabase.co') &&
            parsed.pathname.includes('/storage/v1/object/public/');
    } catch (_error) {
        return false;
    }
}

function stripTransformQueryParams(url) {
    try {
        const parsed = new URL(url);
        TRANSFORM_QUERY_PARAMS.forEach((param) => parsed.searchParams.delete(param));
        return parsed.toString();
    } catch (_error) {
        return url;
    }
}

function buildCardImageUrl(originalUrl) {
    if (!originalUrl) return IMAGE_PLACEHOLDER_URL;

    // Se for URL do Supabase, sempre limpamos a sujeira querystring original
    // antes de enviá-la ao proxy do Netlify para obter a Imagem base Master e cachear do lado deles.
    let cleanUrl = originalUrl;
    if (isSupabaseStorageUrl(cleanUrl)) {
        cleanUrl = stripTransformQueryParams(cleanUrl);
    }
    
    // Agora encapsula na CDN do Netlify
    return applyImageProxy(cleanUrl);
}

function getPetPhotos(pet) {
    if (!Array.isArray(pet?.fotos)) return [];
    return pet.fotos
        .filter((url) => typeof url === 'string' && url.trim() !== '')
        .map((url) => (isSupabaseStorageUrl(url) ? stripTransformQueryParams(url) : url));
}

function getPetRenderSignature(pet) {
    const photos = getPetPhotos(pet);
    const caracteristicas = Array.isArray(pet.caracteristicas_especiais)
        ? pet.caracteristicas_especiais.join('|')
        : '';

    return [
        pet.id,
        pet.nome,
        pet.especie,
        pet.idade,
        pet.status,
        pet.porte,
        pet.sexo,
        pet.raca || '',
        caracteristicas,
        photos[0] || '',
    ].join('::');
}

// Mapeamento de características especiais
const CARACTERISTICAS_ESPECIAIS = {
    cegueira_total: 'Cegueira total',
    cegueira_parcial: 'Cegueira parcial',
    surdez_total: 'Surdez total',
    surdez_parcial: 'Surdez parcial',
    paralisia_traseira_total: 'Paralisia traseira total',
    paralisia_traseira_parcial: 'Paralisia traseira parcial',
    paralisia_dianteira_total: 'Paralisia dianteira total',
    paralisia_dianteira_parcial: 'Paralisia dianteira parcial',
    amputado_dianteiro: 'Amputado membro dianteiro',
    amputado_traseiro: 'Amputado membro traseiro',
    usa_cadeira_rodas: 'Usa cadeira rodas',
    epilepsia: 'Epilepsia',
    medicacao_continua: 'Medicação contínua',
    incontinencia_urinaria: 'Incontinência urinária',
    problemas_cardiacos: 'Problemas cardíacos',
    deficiencia_respiratoria: 'Deficiência respiratória',
    displasia_coxofemoral: 'Displasia coxofemoral',
    sequela_neurologica: 'Sequela neurológica',
    limitacao_motora_idoso: 'Limitação motora idoso',
    necessidades_alimentares: 'Necessidades alimentares especiais',
};

// Função para formatar característica especial
function formatarCaracteristicaEspecial(id) {
    return CARACTERISTICAS_ESPECIAIS[id] || id;
}

// Função para criar card de pet
function createPetCard(pet) {
    const card = document.createElement('div');
    card.className = 'pet-card';
    card.setAttribute('data-pet-id', pet.id);
    card.dataset.renderSignature = getPetRenderSignature(pet);
    
    const photos = getPetPhotos(pet);
    const primaryPhotoOriginal = photos[0] || null;
    const fotoUrl = primaryPhotoOriginal
        ? buildCardImageUrl(primaryPhotoOriginal)
        : IMAGE_PLACEHOLDER_URL;
    
    const especieIcon = pet.especie === 'CÃO' ? 'fa-dog' : 'fa-cat';
    const sexoIcon = pet.sexo === 'MACHO' ? 'fa-mars' : 'fa-venus';
    const raca = pet.raca || 'SRD';
    
    let caracteristicasHTML = '';
    if (pet.caracteristicas_especiais && pet.caracteristicas_especiais.length > 0) {
        caracteristicasHTML = `
            <div class="divider"></div>
            <div class="caracteristicas-container">
                <div class="caracteristicas-title">Características Especiais</div>
                <div class="caracteristicas-chips">
                    ${pet.caracteristicas_especiais.map(car => `
                        <div class="caracteristica-chip">
                            <span class="caracteristica-text">${formatarCaracteristicaEspecial(car)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    card.innerHTML = `
        <img src="${fotoUrl}" alt="${pet.nome}" class="pet-image" loading="lazy" crossorigin="anonymous">
        <div class="pet-content">
            <div class="pet-header">
                <div class="pet-name-container">
                    <h3 class="pet-name">${pet.nome}</h3>
                    <i class="fas ${especieIcon} pet-species-icon"></i>
                </div>
            </div>
            
            <div class="pet-info-container">
                <div class="info-grid">
                    <div class="info-block">
                        <span class="info-label">Características de</span>
                        <span class="pet-info">${raca}</span>
                    </div>
                    <div class="info-block">
                        <span class="info-label">Sexo</span>
                        <span class="pet-info">${pet.sexo === 'MACHO' ? 'Macho' : 'Fêmea'}</span>
                    </div>
                    <div class="info-block">
                        <span class="info-label">Idade estimada</span>
                        <span class="pet-info">${pet.idade}</span>
                    </div>
                    <div class="info-block">
                        <span class="info-label">Porte estimado</span>
                        <span class="pet-info">${pet.porte ? pet.porte.charAt(0).toUpperCase() + pet.porte.slice(1).toLowerCase() : ''}</span>
                    </div>
                </div>
            </div>
            
            ${caracteristicasHTML}
        </div>
    `;
    
    return card;
}

function renderPetsColumn(container, petsByColumn, emptyStateHTML) {
    if (petsByColumn.length === 0) {
        if (!container.querySelector('.empty-state') || container.children.length !== 1) {
            container.innerHTML = emptyStateHTML;
        }
        return;
    }

    const existingCardsById = new Map();
    container.querySelectorAll('.pet-card').forEach((card) => {
        existingCardsById.set(card.getAttribute('data-pet-id'), card);
    });

    const fragment = document.createDocumentFragment();

    petsByColumn.forEach((pet) => {
        const petId = String(pet.id);
        const existingCard = existingCardsById.get(petId);
        const nextSignature = getPetRenderSignature(pet);

        let cardNode = existingCard;
        if (!cardNode || cardNode.dataset.renderSignature !== nextSignature) {
            cardNode = createPetCard(pet);
        }

        fragment.appendChild(cardNode);
    });

    container.replaceChildren(fragment);
}

// Função para renderizar pets em suas respectivas colunas
function renderPets() {
    const disponivelContainer = document.getElementById('disponivel-cards');
    const processoContainer = document.getElementById('processo-cards');
    const adotadoContainer = document.getElementById('adotado-cards');

    // Filtrar pets por status
    const disponiveis = pets.filter((p) => p.status === 'DISPONIVEL');
    const emProcesso = pets.filter((p) => p.status === 'EM_PROCESSO_ADOTIVO');
    const adotados = pets.filter((p) => p.status === 'ADOTADO');

    // Atualizar badges de contagem
    document.getElementById('disponivel-count').textContent = disponiveis.length;
    document.getElementById('processo-count').textContent = emProcesso.length;
    document.getElementById('adotado-count').textContent = adotados.length;

    renderPetsColumn(
        disponivelContainer,
        disponiveis,
        '<div class="empty-state"><i class="fas fa-heart"></i><p>Nenhum pet disponível</p></div>'
    );
    renderPetsColumn(
        processoContainer,
        emProcesso,
        '<div class="empty-state"><i class="fas fa-file-signature"></i><p>Nenhum pet em processo</p></div>'
    );
    renderPetsColumn(
        adotadoContainer,
        adotados,
        '<div class="empty-state"><i class="fas fa-home"></i><p>Nenhum pet adotado hoje</p></div>'
    );

    // Atualizar badges das abas mobile
    updateTabBadges();
}

// Função para verificar se uma data é hoje
function isToday(dateString) {
    const today = new Date();
    const date = new Date(dateString);
    
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

// Função para buscar pets diretamente do Supabase
async function loadPets() {
    try {
        // Buscar pets disponíveis e em processo (sem filtro de data)
        const { data: petsDisponiveis, error: errorDisponiveis } = await supabaseClient
            .from('pets')
            .select(`
                id,
                nome,
                especie,
                idade,
                status,
                porte,
                sexo,
                fotos,
                raca,
                caracteristicas_especiais,
                created_at
            `)
            .in('status', ['DISPONIVEL', 'EM_PROCESSO_ADOTIVO'])
            .order('created_at', { ascending: false });
        
        if (errorDisponiveis) {
            console.error('Erro ao buscar pets disponíveis:', errorDisponiveis);
            throw errorDisponiveis;
        }
        
        // Buscar pets adotados hoje com data da adoção
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);
        
        const { data: petsAdotados, error: errorAdotados } = await supabaseClient
            .from('pets')
            .select(`
                id,
                nome,
                especie,
                idade,
                status,
                porte,
                sexo,
                fotos,
                raca,
                caracteristicas_especiais,
                created_at,
                adocoes!inner(data_adocao)
            `)
            .eq('status', 'ADOTADO')
            .gte('adocoes.data_adocao', hoje.toISOString())
            .lt('adocoes.data_adocao', amanha.toISOString())
            .order('created_at', { ascending: false });
        
        if (errorAdotados) {
            console.error('Erro ao buscar pets adotados:', errorAdotados);
            // Se houver erro, continua sem os adotados
            pets = petsDisponiveis || [];
        } else {
            // Combinar todos os pets
            pets = [...(petsDisponiveis || []), ...(petsAdotados || [])];
        }
        
        console.log(`Carregados ${petsDisponiveis?.length || 0} pets disponíveis/em processo e ${petsAdotados?.length || 0} pets adotados hoje`);
        renderPets();
    } catch (error) {
        console.error('Erro ao carregar pets:', error);
        // Exibir mensagem de erro para o usuário
        const containers = document.querySelectorAll('.cards-container');
        containers.forEach(container => {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar pets</p></div>';
        });
    }
}

// Função para animar mudança de card entre colunas
function animateCardMove(petId, newStatus) {
    const card = document.querySelector(`[data-pet-id="${petId}"]`);
    if (card) {
        card.classList.add('card-moving');
        setTimeout(() => {
            card.classList.remove('card-moving');
        }, 600);
    }
}

function isTrackedStatus(status) {
    return TRACKED_STATUSES.has(status);
}

function upsertPetInState(pet) {
    if (!pet?.id) return false;

    const index = pets.findIndex((item) => item.id === pet.id);
    if (index === -1) {
        pets.push(pet);
        return true;
    }

    pets[index] = pet;
    return true;
}

function removePetFromState(petId) {
    if (!petId) return false;
    const originalLength = pets.length;
    pets = pets.filter((item) => item.id !== petId);
    return pets.length !== originalLength;
}

function shouldReloadFromDatabase(payload) {
    const newStatus = payload?.new?.status;
    const oldStatus = payload?.old?.status;

    // A coluna de adotados depende de join com adocoes e filtro por data;
    // para manter consistencia, recarregamos apenas quando ADOTADO for afetado.
    return newStatus === 'ADOTADO' || oldStatus === 'ADOTADO';
}

function applyRealtimePayload(payload) {
    if (!payload?.eventType) {
        loadPets();
        return;
    }

    if (shouldReloadFromDatabase(payload)) {
        loadPets();
        return;
    }

    let hasChanges = false;

    if (payload.eventType === 'INSERT') {
        if (isTrackedStatus(payload.new?.status)) {
            hasChanges = upsertPetInState(payload.new);
        }
    } else if (payload.eventType === 'UPDATE') {
        if (isTrackedStatus(payload.new?.status)) {
            hasChanges = upsertPetInState(payload.new);
        } else {
            hasChanges = removePetFromState(payload.old?.id || payload.new?.id);
        }
    } else if (payload.eventType === 'DELETE') {
        hasChanges = removePetFromState(payload.old?.id);
    } else {
        loadPets();
        return;
    }

    if (hasChanges) {
        renderPets();
    }
}

// Configurar Realtime para atualizações em tempo real
function setupRealtimeSubscription() {
    if (realtimeChannel) {
        realtimeChannel.unsubscribe();
    }
    
    realtimeChannel = supabaseClient
        .channel('pets-public-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'pets',
                filter: 'status=in.(DISPONIVEL,EM_PROCESSO_ADOTIVO,ADOTADO)'
            },
            (payload) => {
                console.log('Mudança detectada:', payload);
                applyRealtimePayload(payload);
            }
        )
        .subscribe((status) => {
            console.log('Status da inscrição Realtime:', status);
        });
}

// Função para atualizar data e hora atual
function updateDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const formatted = `${day}/${month}/${year} - ${hours}:${minutes}`;
    document.getElementById('current-datetime').textContent = formatted;
}

// =============================================
// Mobile UX: Tabs + Swipe sincronizados
// =============================================

let isScrollingFromTab = false; // Flag para evitar loop tab->scroll->tab
let currentActiveColumn = 0; // Indice da coluna ativa atual

function isMobile() {
    return window.innerWidth <= 768;
}

// Mapeamento coluna <-> indice
const COLUMN_NAMES = ['disponivel', 'processo', 'adotado'];

// --- Tabs: clique rola o board ---
function setupMobileTabs() {
    const tabsContainer = document.getElementById('mobile-tabs');
    if (!tabsContainer) return;

    tabsContainer.addEventListener('click', (e) => {
        const tab = e.target.closest('.mobile-tab');
        if (!tab) return;

        const columnName = tab.dataset.column;
        const index = COLUMN_NAMES.indexOf(columnName);
        if (index === -1) return;

        // Atualizar aba visual
        setActiveTab(index);

        // Rolar o board para a coluna correspondente
        const board = document.getElementById('kanban-board');
        if (!board) return;

        isScrollingFromTab = true;
        const columns = board.querySelectorAll('.kanban-column');
        if (columns[index]) {
            const col = columns[index];
            const scrollTarget = col.offsetLeft - (board.offsetWidth - col.offsetWidth) / 2;
            board.scrollTo({ left: scrollTarget, behavior: 'smooth' });
        }

        // Rolar a pagina para o topo ao trocar de coluna
        if (index !== currentActiveColumn) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            currentActiveColumn = index;
        }

        // Liberar flag apos a animacao de scroll terminar
        setTimeout(() => { isScrollingFromTab = false; }, 400);
    });
}

// --- Scroll do board atualiza a aba ativa ---
function setupBoardScrollSync() {
    const board = document.getElementById('kanban-board');
    if (!board) return;

    board.addEventListener('scroll', () => {
        if (isScrollingFromTab) return; // Ignorar scroll causado por clique na tab

        const scrollLeft = board.scrollLeft;
        const columnWidth = board.offsetWidth;
        const activeIndex = Math.round(scrollLeft / columnWidth);

        setActiveTab(activeIndex);

        // Rolar a pagina para o topo ao trocar de coluna via swipe
        if (activeIndex !== currentActiveColumn) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            currentActiveColumn = activeIndex;
        }
    }, { passive: true });
}

// --- Atualizar aba ativa visualmente ---
function setActiveTab(index) {
    const tabs = document.querySelectorAll('.mobile-tab');
    tabs.forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
}

// --- Update Tab Badges ---
function updateTabBadges() {
    const disponivelCount = document.getElementById('disponivel-count');
    const processoCount = document.getElementById('processo-count');
    const adotadoCount = document.getElementById('adotado-count');

    const tabDisponivel = document.getElementById('tab-disponivel-count');
    const tabProcesso = document.getElementById('tab-processo-count');
    const tabAdotado = document.getElementById('tab-adotado-count');

    if (tabDisponivel && disponivelCount) tabDisponivel.textContent = disponivelCount.textContent;
    if (tabProcesso && processoCount) tabProcesso.textContent = processoCount.textContent;
    if (tabAdotado && adotadoCount) tabAdotado.textContent = adotadoCount.textContent;
}

// Inicializar aplicação
async function init() {
    console.log('Inicializando aplicação...');
    await loadPets();
    setupRealtimeSubscription();
    
    // Atualizar data/hora atual e configurar atualização a cada minuto
    updateDateTime();
    setInterval(updateDateTime, 60 * 1000);
    
    // Setup mobile UX (tabs + swipe sincronizados)
    setupMobileTabs();
    setupBoardScrollSync();
}

// Iniciar quando a página carregar
window.addEventListener('DOMContentLoaded', () => {
    init();
});

// Limpar subscription quando sair da página
window.addEventListener('beforeunload', () => {
    if (realtimeChannel) {
        realtimeChannel.unsubscribe();
    }
});

})();