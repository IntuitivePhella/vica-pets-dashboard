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
    
    const fotoUrl = pet.fotos && pet.fotos.length > 0 
        ? pet.fotos[0] 
        : 'https://via.placeholder.com/300x200?text=Sem+Foto';
    
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
        <img src="${fotoUrl}" alt="${pet.nome}" class="pet-image" loading="lazy" data-photos='${JSON.stringify(pet.fotos || [])}' style="cursor: pointer;" draggable="false" oncontextmenu="return false;">
        <div class="pet-content">
            <div class="pet-header">
                <div class="pet-name-container">
                    <h3 class="pet-name">${pet.nome}</h3>
                    <i class="fas ${especieIcon} pet-species-icon"></i>
                </div>
            </div>
            
            <div class="pet-info-container">
                <div class="info-row">
                    <div class="info-group">
                        <i class="fas fa-dna info-icon"></i>
                        <span class="pet-info">${raca}</span>
                    </div>
                    <span class="separator">|</span>
                    <div class="info-group">
                        <i class="fas fa-clock info-icon"></i>
                        <span class="pet-info">${pet.idade}</span>
                    </div>
                    <span class="separator">|</span>
                    <div class="info-group">
                        <i class="fas ${sexoIcon} info-icon"></i>
                        <span class="pet-info">${pet.sexo === 'MACHO' ? 'Macho' : 'Fêmea'}</span>
                    </div>
                </div>
            </div>
            
            ${caracteristicasHTML}
        </div>
    `;
    
    // Adicionar event listener para abrir modal ao clicar na imagem
    const petImage = card.querySelector('.pet-image');
    if (petImage) {
        petImage.addEventListener('click', (e) => {
            e.stopPropagation();
            const photos = JSON.parse(petImage.dataset.photos || '[]');
            openImageModal(photos, 0);
        });
    }
    
    return card;
}

// Função para renderizar pets em suas respectivas colunas
function renderPets() {
    const disponivelContainer = document.getElementById('disponivel-cards');
    const processoContainer = document.getElementById('processo-cards');
    const adotadoContainer = document.getElementById('adotado-cards');
    
    // Limpar containers
    disponivelContainer.innerHTML = '';
    processoContainer.innerHTML = '';
    adotadoContainer.innerHTML = '';
    
    // Filtrar pets por status
    const disponiveis = pets.filter(p => p.status === 'DISPONIVEL');
    const emProcesso = pets.filter(p => p.status === 'EM_PROCESSO_ADOTIVO');
    const adotados = pets.filter(p => p.status === 'ADOTADO');
    
    // Atualizar badges de contagem
    document.getElementById('disponivel-count').textContent = disponiveis.length;
    document.getElementById('processo-count').textContent = emProcesso.length;
    document.getElementById('adotado-count').textContent = adotados.length;
    
    // Renderizar pets disponíveis
    if (disponiveis.length === 0) {
        disponivelContainer.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><p>Nenhum pet disponível</p></div>';
    } else {
        disponiveis.forEach(pet => {
            disponivelContainer.appendChild(createPetCard(pet));
        });
    }
    
    // Renderizar pets em processo
    if (emProcesso.length === 0) {
        processoContainer.innerHTML = '<div class="empty-state"><i class="fas fa-file-signature"></i><p>Nenhum pet em processo</p></div>';
    } else {
        emProcesso.forEach(pet => {
            processoContainer.appendChild(createPetCard(pet));
        });
    }
    
    // Renderizar pets adotados (apenas do dia atual)
    if (adotados.length === 0) {
        adotadoContainer.innerHTML = '<div class="empty-state"><i class="fas fa-home"></i><p>Nenhum pet adotado hoje</p></div>';
    } else {
        adotados.forEach(pet => {
            adotadoContainer.appendChild(createPetCard(pet));
        });
    }
    
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
                
                // Quando houver mudança, recarregar tudo para garantir que apenas
                // pets adotados hoje aparecem
                loadPets();
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
    
    // Atualizar a cada 5 minutos como fallback
    setInterval(loadPets, 5 * 60 * 1000);
    
    // Setup mobile UX (tabs + swipe sincronizados)
    setupMobileTabs();
    setupBoardScrollSync();
}

// Variáveis para controle do modal de imagem
let currentImageIndex = 0;
let currentPhotos = [];
let currentScale = 1;

// Função para abrir o modal de imagem
function openImageModal(photos, index) {
    currentPhotos = photos.filter(url => url && url.trim() !== '');
    if (currentPhotos.length === 0) return;
    
    currentImageIndex = index;
    currentScale = 1;
    
    // Criar modal se não existir
    let modal = document.getElementById('image-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content-zoom">
                <button class="modal-close" onclick="closeImageModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-image-container">
                    <img id="modal-image" src="" alt="Pet" class="modal-image" draggable="false" oncontextmenu="return false;">
                </div>
                ${currentPhotos.length > 1 ? `
                    <button class="modal-nav modal-prev" onclick="prevImage()">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="modal-nav modal-next" onclick="nextImage()">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <div class="modal-pagination" id="modal-pagination"></div>
                ` : ''}
                <div class="modal-zoom-hint">
                    <i class="fas fa-search-plus"></i> Use a roda do mouse para dar zoom
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Event listener para fechar ao clicar no backdrop
        modal.querySelector('.modal-backdrop').addEventListener('click', closeImageModal);
        
        // Event listener para zoom com scroll do mouse
        const modalImage = modal.querySelector('#modal-image');
        modal.querySelector('.modal-content-zoom').addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY * -0.001;
            currentScale = Math.min(Math.max(1, currentScale + delta), 4);
            modalImage.style.transform = `scale(${currentScale})`;
        });
        
        // Teclas do teclado
        document.addEventListener('keydown', handleKeyPress);
    }
    
    updateModalImage();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Função para fechar o modal
function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        currentScale = 1;
    }
}

// Função para atualizar a imagem do modal
function updateModalImage() {
    const modal = document.getElementById('image-modal');
    if (!modal) return;
    
    const modalImage = modal.querySelector('#modal-image');
    modalImage.src = currentPhotos[currentImageIndex];
    modalImage.style.transform = `scale(${currentScale})`;
    
    // Atualizar paginação
    if (currentPhotos.length > 1) {
        const pagination = modal.querySelector('#modal-pagination');
        if (pagination) {
            pagination.innerHTML = currentPhotos.map((_, index) => 
                `<span class="pagination-dot ${index === currentImageIndex ? 'active' : ''}"></span>`
            ).join('');
        }
        
        // Atualizar visibilidade dos botões de navegação
        const prevBtn = modal.querySelector('.modal-prev');
        const nextBtn = modal.querySelector('.modal-next');
        if (prevBtn) prevBtn.style.display = currentImageIndex > 0 ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = currentImageIndex < currentPhotos.length - 1 ? 'flex' : 'none';
    }
}

// Função para ir para a imagem anterior
function prevImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        currentScale = 1;
        updateModalImage();
    }
}

// Função para ir para a próxima imagem
function nextImage() {
    if (currentImageIndex < currentPhotos.length - 1) {
        currentImageIndex++;
        currentScale = 1;
        updateModalImage();
    }
}

// Função para lidar com teclas do teclado
function handleKeyPress(e) {
    const modal = document.getElementById('image-modal');
    if (!modal || modal.style.display !== 'flex') return;
    
    switch(e.key) {
        case 'Escape':
            closeImageModal();
            break;
        case 'ArrowLeft':
            prevImage();
            break;
        case 'ArrowRight':
            nextImage();
            break;
    }
}

// Proteção contra cópia e salvamento de imagens
function setupImageProtection() {
    // Desabilitar menu de contexto (botão direito) em todas as imagens
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            return false;
        }
    });
    
    // Desabilitar arrastar imagens
    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            return false;
        }
    });
    
    // Desabilitar atalhos de teclado para salvar
    document.addEventListener('keydown', (e) => {
        // Ctrl+S ou Cmd+S (salvar)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+S ou Cmd+Shift+S (salvar como)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            return false;
        }
        // Print Screen (captura de tela) - não pode ser totalmente bloqueado
        // mas podemos mostrar um aviso
        if (e.key === 'PrintScreen') {
            console.log('Captura de tela detectada');
        }
    });
    
    // Desabilitar seleção e cópia em imagens
    document.addEventListener('selectstart', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            return false;
        }
    });
    
    // Desabilitar copiar imagens
    document.addEventListener('copy', (e) => {
        const selection = window.getSelection();
        if (selection && selection.toString().length === 0) {
            // Se nada estiver selecionado, pode ser tentativa de copiar imagem
            e.preventDefault();
            return false;
        }
    });
}

// Expor funções do modal para o escopo global
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.prevImage = prevImage;
window.nextImage = nextImage;

// Iniciar quando a página carregar
window.addEventListener('DOMContentLoaded', () => {
    init();
    setupImageProtection();
});

// Limpar subscription quando sair da página
window.addEventListener('beforeunload', () => {
    if (realtimeChannel) {
        realtimeChannel.unsubscribe();
    }
});

})();