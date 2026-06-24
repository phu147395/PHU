const API_BASE = 'https://localhost:7021/api';
let allMovies = []; // Lưu trữ phim để lọc nhanh trên web

document.addEventListener('DOMContentLoaded', () => {
    console.log("PHU.Net API fetching started...");
    fetchCountriesAndBuildNav();
    fetchCategoriesAndBuildMenu();
    fetchMovies();
    fetchFeaturedMovies();

    // Click ra ngoài thì đóng dropdown
    document.addEventListener('click', (e) => {
        const dropdown = document.querySelector('.dropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            const menu = document.getElementById('categoryMenu');
            if (menu) menu.classList.remove('show');
        }
    });

    // Cài đặt chức năng Tìm Kiếm
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => handleSearch(searchInput.value));
        searchInput.addEventListener('input', (e) => {
            // Tìm kiếm realtime mỗi khi gõ phím
            handleSearch(e.target.value);
        });
    }
});

// Hàm bật/tắt Menu Thể Loại khi click
function toggleCategoryMenu() {
    const menu = document.getElementById('categoryMenu');
    if (menu) menu.classList.toggle('show');
}

// Hàm lấy sách các Quốc Gia từ Database và nhúng vào Thanh Điều Hướng (Nav)
async function fetchCountriesAndBuildNav() {
    try {
        const response = await fetch(`${API_BASE}/countries`);
        if (!response.ok) return;
        const countries = await response.json();

        const navUl = document.querySelector('.main-nav ul');

        // Mặc định tab đầu tiên là Tất cả phim
        navUl.innerHTML = '<li class="active" style="cursor:pointer;" onclick="filterByCountry(null, this)"><a onclick="event.preventDefault()">PHIM MỚI (TẤT CẢ)</a></li>';

        // Tạo tab tự động cho mỗi Quốc Gia có trong DB
        countries.forEach(c => {
            const li = document.createElement('li');
            li.style.cursor = 'pointer';
            li.onclick = function () { filterByCountry(c.id, this); };
            li.innerHTML = `<a onclick="event.preventDefault()">${c.name.toUpperCase()}</a>`;
            navUl.appendChild(li);
        });
    } catch (e) {
        console.error("Lỗi khi tải Menu Quốc gia:", e);
    }
}

// Hàm lấy danh sách Thể loại (Category)
async function fetchCategoriesAndBuildMenu() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        if (!response.ok) return;
        const categories = await response.json();

        const catMenu = document.getElementById('categoryMenu');
        if (!catMenu) return;

        catMenu.innerHTML = '';

        categories.forEach(c => {
            const a = document.createElement('a');
            a.style.cursor = 'pointer';
            a.onclick = function () { filterByCategory(c.id, c.name); };
            a.innerHTML = c.name;
            catMenu.appendChild(a);
        });
    } catch (e) {
        console.error("Lỗi khi tải Menu Thể Loại:", e);
    }
}

// Hàm lọc phim theo Thể loại
function filterByCategory(categoryId, categoryName) {
    let filtered = allMovies;
    if (categoryId !== null) {
        filtered = allMovies.filter(m => m.categoryId === categoryId);
    }

    const sectionHeader = document.querySelector('.section-header h2');
    if (sectionHeader) {
        if (categoryId === null) {
            sectionHeader.innerHTML = `TẤT CẢ DANH MỤC <i data-lucide="chevron-down"></i>`;
        } else {
            sectionHeader.innerHTML = `THỂ LOẠI: ${categoryName.toUpperCase()} <i data-lucide="chevron-down"></i>`;
        }
        if (window.lucide) lucide.createIcons();
    }

    // Xoá highlight trên menu Quốc Gia
    document.querySelectorAll('.main-nav ul li').forEach(li => li.classList.remove('active'));

    renderMovies(filtered);
}

// Hàm lọc phim bấm vào Quốc gia trên thanh Nav
function filterByCountry(countryId, element) {
    // Đổi màu tab được chọn
    document.querySelectorAll('.main-nav ul li').forEach(li => li.classList.remove('active'));
    if (element) element.classList.add('active');

    // Lọc danh sách phim
    let filtered = allMovies;
    if (countryId !== null) {
        filtered = allMovies.filter(m => m.countryId === countryId);
    }

    // Đổi tiêu đề mục
    const sectionHeader = document.querySelector('.section-header h2');
    if (sectionHeader) {
        if (countryId === null) {
            sectionHeader.innerHTML = `PHIM MỚI CẬP NHẬT <i data-lucide="chevron-down"></i>`;
        } else {
            const countryName = element.innerText;
            sectionHeader.innerHTML = `PHIM ${countryName} <i data-lucide="chevron-down"></i>`;
        }
        if (window.lucide) lucide.createIcons();
    }

    renderMovies(filtered);
}

// Hàm Tìm Kiếm
function handleSearch(query) {
    if (!query || query.trim() === '') {
        // Nếu xoá trắng ô tìm kiếm, trở về mặc định
        document.querySelector('.section-header h2').innerHTML = `PHIM MỚI CẬP NHẬT <i data-lucide="chevron-down"></i>`;
        if (window.lucide) lucide.createIcons();
        renderMovies(allMovies);
        return;
    }

    query = query.toLowerCase().trim();
    const filtered = allMovies.filter(m =>
        (m.title && m.title.toLowerCase().includes(query)) ||
        (m.subtitle && m.subtitle.toLowerCase().includes(query))
    );

    const sectionHeader = document.querySelector('.section-header h2');
    if (sectionHeader) {
        // Cập nhật tiêu đề để hiển thị từ khoá
        sectionHeader.innerHTML = `KẾT QUẢ TÌM KIẾM: "${query}" <i data-lucide="chevron-down"></i>`;
        if (window.lucide) lucide.createIcons();
    }

    // Xoá highlight trên menu
    document.querySelectorAll('.main-nav ul li').forEach(li => li.classList.remove('active'));

    renderMovies(filtered);
}

// Hàm lấy tất cả Phim
async function fetchMovies() {
    const grid = document.querySelector('.movie-grid');
    try {
        const response = await fetch(`${API_BASE}/movies`);
        if (!response.ok) throw new Error("Server trả về lỗi: " + response.status);

        allMovies = await response.json();
        renderMovies(allMovies); // Hiển thị tất cả lúc mới Load

    } catch (error) {
        grid.innerHTML = `<p style="color:#ef4444;font-weight:bold;">Lỗi kết nối Server Backend C# (${API_BASE}). Vui lòng đảm bảo bạn đang Run (Play) dự án DA1 trong Visual Studio.</p>`;
        console.error("Fetch movies failed:", error);
    }
}

// Hàm in phim ra màn hình (Được tách riêng để tái sử dụng khi Lọc)
function renderMovies(movies) {
    const grid = document.querySelector('.movie-grid');
    grid.innerHTML = ''; // Xoá trắng

    if (movies.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-dim);">Chưa có bộ phim nào thuộc mục này.</p>';
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => { window.location.href = `player.html?id=${movie.id}`; };
        card.innerHTML = `
            <div class="poster-wrapper">
                <img src="${movie.imageUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
                <div class="overlay">
                    <i data-lucide="play-circle" class="play-icon"></i>
                </div>
                <span class="badge">${movie.currentEpisode || 'N/A'}/${movie.totalEpisodes || 'N/A'}</span>
            </div>
            <div class="movie-info">
                <h3>${movie.title || 'Phim mới'}</h3>
                <p>${movie.subtitle || ''}</p>
            </div>
        `;
        grid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

async function fetchFeaturedMovies() {
    const sidebarList = document.querySelector('.sidebar-list');
    try {
        const response = await fetch(`${API_BASE}/movies/featured`);
        if (!response.ok) throw new Error("Lỗi API featured");

        const featured = await response.json();
        sidebarList.innerHTML = '';

        if (featured.length === 0) {
            sidebarList.innerHTML = '<p style="padding:1rem;color:var(--text-muted);">Chưa có phim nổi bật.</p>';
            const bannerTitle = document.querySelector('.featured-info h3');
            if (bannerTitle) bannerTitle.innerText = 'Trống';
            return;
        }

        featured.forEach(movie => {
            const item = document.createElement('div');
            item.className = 'list-item';

            const countryName = movie.country ? movie.country.name : 'Chưa rõ';

            item.innerHTML = `
                <img src="${movie.imageUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/60x80?text=Img'">
                <div class="item-details">
                    <h4>${movie.title || 'Phim'}</h4>
                    <p>${countryName}</p>
                    <span>${movie.currentEpisode || '0'}/${movie.totalEpisodes || '0'}</span>
                </div>
            `;
            sidebarList.appendChild(item);
        });

        if (featured.length > 0) {
            const bannerImg = document.querySelector('.featured-banner img');
            const bannerTitle = document.querySelector('.featured-info h3');
            if (bannerImg && featured[0].imageUrl) bannerImg.src = featured[0].imageUrl;
            if (bannerTitle) bannerTitle.innerText = featured[0].title || 'No Title';
        }

    } catch (error) {
        sidebarList.innerHTML = `<p style="padding:1rem;color:#ef4444;">Không thể lấy dữ liệu.</p>`;
        console.error("Fetch featured failed:", error);
    }
}
