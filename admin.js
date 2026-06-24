const API_BASE = 'https://localhost:7021/api';

document.addEventListener('DOMContentLoaded', () => {
    loadDropdowns();

    // Setup Category
    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('catName').value;
        const res = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (res.ok) { alert('Thêm Thể loại thành công!'); document.getElementById('categoryForm').reset(); loadDropdowns(); }
    });

    // Setup Country
    document.getElementById('countryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('countryName').value;
        const res = await fetch(`${API_BASE}/countries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (res.ok) { alert('Thêm Quốc gia thành công!'); document.getElementById('countryForm').reset(); loadDropdowns(); }
    });

    // Setup Movie
    const mForm = document.getElementById('movieForm');
    mForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSubmit = mForm.querySelector('.btn-submit');
        const oldBtnText = btnSubmit.innerText;
        btnSubmit.innerText = "Đang tải dữ liệu. Vui lòng không đóng trang...";
        btnSubmit.disabled = true;

        try {
            let finalImageUrl = document.getElementById('mImage').value;
            let finalVideoUrl = document.getElementById('mVideo').value;

            // Xử lý upload ảnh nếu có file
            const imageFile = document.getElementById('mImageFile').files[0];
            if (imageFile) {
                btnSubmit.innerText = "Đang tải ảnh lên Server...";
                let formData = new FormData();
                formData.append("file", imageFile);
                let res = await fetch(`${API_BASE}/upload/image`, { method: 'POST', body: formData });
                if (res.ok) { let data = await res.json(); finalImageUrl = data.imageUrl; }
            }

            // Xử lý upload video nếu có file
            const videoFile = document.getElementById('mVideoFile').files[0];
            if (videoFile) {
                btnSubmit.innerText = "Đang tải video lên Server... Có thể tốn vài phút tùy dung lượng.";
                let formData = new FormData();
                formData.append("file", videoFile);
                let res = await fetch(`${API_BASE}/upload/video`, { method: 'POST', body: formData });
                if (res.ok) {
                    let data = await res.json();
                    finalVideoUrl = data.videoUrl;
                }
                else {
                    let errMsg = await res.text();
                    alert(`Lỗi khi tải video: ${errMsg}`);
                    throw new Error(errMsg);
                }
            }

            btnSubmit.innerText = "Đang lưu cơ sở dữ liệu...";

            const movieData = {
                title: document.getElementById('mTitle').value,
                subtitle: document.getElementById('mSubtitle').value,
                currentEpisode: document.getElementById('mCurrent').value,
                totalEpisodes: document.getElementById('mTotal').value,
                imageUrl: finalImageUrl,
                videoUrl: finalVideoUrl,
                categoryId: parseInt(document.getElementById('mCategory').value),
                countryId: parseInt(document.getElementById('mCountry').value),
                isFeatured: document.getElementById('mFeatured').checked
            };

            const res = await fetch(`${API_BASE}/movies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(movieData)
            });

            if (res.ok) {
                alert('Đăng Phim mới thành công!');
                mForm.reset();
            } else {
                alert('Có lỗi xảy ra khi lưu phim.');
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi Upload.");
        }

        btnSubmit.innerText = oldBtnText;
        btnSubmit.disabled = false;
    });

    // Gọi hàm load danh sách phim khi vào admin
    loadAdminMovies();

    // Setup Episode Form
    const eForm = document.getElementById('episodeForm');
    if (eForm) {
        eForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = document.querySelector('.e-submit');
            const oldBtnText = btnSubmit.innerText;
            btnSubmit.innerText = "Đang xử lý...";
            btnSubmit.disabled = true;

            try {
                let finalVideoUrl = document.getElementById('eVideoUrl').value;
                const videoFile = document.getElementById('eVideoFile').files[0];

                if (videoFile) {
                    btnSubmit.innerText = "Đang tải video lên...";
                    let formData = new FormData();
                    formData.append("file", videoFile);
                    let res = await fetch(`${API_BASE}/upload/video`, { method: 'POST', body: formData });
                    if (res.ok) { let data = await res.json(); finalVideoUrl = data.videoUrl; }
                    else { throw new Error("Lỗi upload video."); }
                }

                const epData = {
                    movieId: parseInt(document.getElementById('eMovie').value),
                    episodeName: document.getElementById('eName').value,
                    videoUrl: finalVideoUrl
                };

                const res = await fetch(`${API_BASE}/episodes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(epData)
                });

                if (res.ok) {
                    alert('Thêm tập mới thành công!');
                    eForm.reset();
                    loadAdminMovies();
                } else { alert("Lỗi khi thêm tập phim."); }
            } catch (err) { alert(err.message); }

            btnSubmit.innerText = oldBtnText;
            btnSubmit.disabled = false;
        });
    }
});

// ==============================
// PHẦN QUẢN LÝ PHIM (Sửa/Xoá)
// ==============================

async function loadAdminMovies() {
    const tbody = document.getElementById('movieTableBody');
    if (!tbody) return;
    try {
        const res = await fetch(`${API_BASE}/movies`);
        const movies = await res.json();

        tbody.innerHTML = '';
        if (movies.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 1rem; text-align:center;">Chưa có phim nào.</td></tr>`;
            return;
        }

        movies.forEach(m => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = "1px solid var(--border-color)";
            tr.innerHTML = `
                <td style="padding: 1rem;">${m.id}</td>
                <td style="padding: 1rem; font-weight: 500;">${m.title}</td>
                <td style="padding: 1rem;">
                    <input type="text" id="ep_${m.id}" value="${m.currentEpisode || ''}" style="width: 80px; padding: 0.3rem; background: var(--bg-main); color: white; border: 1px solid var(--border-color); border-radius: 4px;">
                </td>
                <td style="padding: 1rem;">${m.totalEpisodes || 'N/A'}</td>
                <td style="padding: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.9rem;" onclick="updateEpisode(${m.id})">Lưu Tập Mới</button>
                    <button style="background: #ef4444; color: white; border: none; border-radius: 6px; padding: 0.4rem 0.8rem; cursor: pointer;" onclick="deleteMovie(${m.id})">Xoá Phim</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 1rem; text-align:center; color: red;">Lỗi tải dữ liệu. ${e.message}</td></tr>`;
    }
}

async function updateEpisode(id) {
    const newEp = document.getElementById(`ep_${id}`).value;

    // Lấy thông tin phim cũ
    try {
        const getRes = await fetch(`${API_BASE}/movies/${id}`);
        const movie = await getRes.json();

        movie.currentEpisode = newEp;

        // Cập nhật lên C#
        const res = await fetch(`${API_BASE}/movies/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(movie)
        });

        if (res.ok) {
            alert(`Đã cập nhật tập mới cho phim ID: ${id}`);
        } else {
            const err = await res.text();
            alert("Lỗi khi cập nhật! " + err);
        }
    } catch (e) {
        alert("Lỗi kết nối");
    }
}

async function deleteMovie(id) {
    if (!confirm("Bạn có chắc chắn muốn xoá vĩnh viễn phim này không?")) return;

    try {
        const res = await fetch(`${API_BASE}/movies/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert("Xoá phim thành công!");
            loadAdminMovies(); // Tải lại bảng
        } else {
            alert("Lỗi khi xoá phim.");
        }
    } catch (e) {
        alert("Lỗi kết nối");
    }
}

async function loadDropdowns() {
    try {
        const catRes = await fetch(`${API_BASE}/categories`);
        const eMovie = document.getElementById('eMovie');
        const categories = await catRes.json();
        const mCat = document.getElementById('mCategory');

        mCat.innerHTML = '<option value="">-- Chọn Thể Loại --</option>';
        categories.forEach(c => {
            mCat.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });

        const countRes = await fetch(`${API_BASE}/countries`);
        const countries = await countRes.json();
        const mCountry = document.getElementById('mCountry');

        mCountry.innerHTML = '<option value="">-- Chọn Quốc Gia --</option>';
        countries.forEach(c => {
            mCountry.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });

        if (eMovie) {
            const mRes = await fetch(`${API_BASE}/movies`);
            const movies = await mRes.json();
            eMovie.innerHTML = '<option value="">-- Chọn Phim --</option>';
            movies.forEach(m => {
                eMovie.innerHTML += `<option value="${m.id}">${m.title}</option>`;
            });
        }
    } catch (err) {
        console.log("Error loading dropdowns. API might be offline.");
    }
}
