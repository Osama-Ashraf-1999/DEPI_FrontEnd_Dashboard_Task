// Global variables
let users = [];
let posts = [];
let comments = [];
let favorites = [];
let localUsers = [];
let localPosts = [];
let localComments = [];

// DOM Ready
$(document).ready(function () {
    // Initialize toastr with better visibility
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-bottom-right",
        timeOut: 3000,
        extendedTimeOut: 1000
    };

    // Load data from localStorage
    loadFromLocalStorage();

    // Initialize DataTable
    const usersTable = $('#users-table').DataTable({
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'username' },
            { data: 'email' },
            { data: 'phone' },
            { data: 'website' },
            {
                data: null,
                render: function (data, type, row) {
                    const isFavorite = favorites.includes(row.id);
                    return `<i class="fas fa-star favorite ${isFavorite ? 'text-warning' : 'text-secondary'}" data-id="${row.id}"></i>`;
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return `
                                <button class="btn btn-sm btn-primary action-btn view-user" data-id="${row.id}">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-success action-btn edit-user" data-id="${row.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger action-btn delete-user" data-id="${row.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            `;
                }
            }
        ]
    });

    // Load initial data
    loadData();

    // Event Listeners
    $('#theme-toggle').change(toggleTheme);
    $('.nav-link').click(switchTab);
    $('#save-user-btn').click(saveUser);
    $('#add-post-btn').click(addNewPost);
    $('#save-post-btn').click(savePost);
    $('#save-comment-btn').click(saveComment);
    $('#post-search').on('keyup', searchPosts);
    // $('#export-data-btn').click(exportData);
    // $('#reset-data-btn').click(resetData);

    // Delegated events
    $(document).on('click', '.favorite', toggleFavorite);
    $(document).on('click', '.view-user', viewUser);
    $(document).on('click', '.edit-user', editUser);
    $(document).on('click', '.delete-user', deleteUser);
    $(document).on('click', '.view-comments', viewComments);
    $(document).on('click', '.edit-post', editPost);
    $(document).on('click', '.delete-post', deletePost);
    $(document).on('click', '.add-comment', addNewComment);
});

// Load data from localStorage
function loadFromLocalStorage() {
    try {
        favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        localUsers = JSON.parse(localStorage.getItem('localUsers')) || [];
        localPosts = JSON.parse(localStorage.getItem('localPosts')) || [];
        localComments = JSON.parse(localStorage.getItem('localComments')) || [];

        // Load theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            $('body').removeClass('light-mode').addClass('dark-mode');
            $('#theme-toggle').prop('checked', true);
            // Update toastr for dark mode
            toastr.options.backgroundColor = '#2d3748';
            toastr.options.textColor = '#f8f9fa';
        }
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        // Initialize with empty arrays if there's an error
        favorites = [];
        localUsers = [];
        localPosts = [];
        localComments = [];
    }
}

// Save data to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('favorites', JSON.stringify(favorites));
        localStorage.setItem('localUsers', JSON.stringify(localUsers));
        localStorage.setItem('localPosts', JSON.stringify(localPosts));
        localStorage.setItem('localComments', JSON.stringify(localComments));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        toastr.error('Failed to save data to localStorage');
    }
}

// Load data from APIs
function loadData() {
    showLoader();

    // Load users, posts, and comments in parallel
    Promise.all([
        $.get('https://jsonplaceholder.typicode.com/users'),
        $.get('https://jsonplaceholder.typicode.com/posts'),
        $.get('https://jsonplaceholder.typicode.com/comments')
    ])
        .then(function (results) {
            // Merge API data with locally stored data
            users = [...results[0], ...localUsers];
            posts = [...results[1], ...localPosts];
            comments = [...results[2], ...localComments];

            // Update dashboard counts
            $('#users-count').text(users.length);
            $('#posts-count').text(posts.length);
            $('#comments-count').text(comments.length);

            // Populate users table
            $('#users-table').DataTable().clear().rows.add(users).draw();

            // Render posts
            renderPosts(posts);

            hideLoader();
            toastr.success('Data loaded successfully');
        })
        .catch(function (error) {
            console.error('Error loading data:', error);

            // Use local data if API fails
            users = [...localUsers];
            posts = [...localPosts];
            comments = [...localComments];

            // Update dashboard counts
            $('#users-count').text(users.length);
            $('#posts-count').text(posts.length);
            $('#comments-count').text(comments.length);

            // Populate users table
            $('#users-table').DataTable().clear().rows.add(users).draw();

            // Render posts
            renderPosts(posts);

            hideLoader();
            toastr.error('Failed to load data from API, using local data');
        });
}

// Toggle theme between light and dark mode
function toggleTheme() {
    if ($('body').hasClass('light-mode')) {
        $('body').removeClass('light-mode').addClass('dark-mode');
        localStorage.setItem('theme', 'dark');
        // Update toastr for dark mode
        toastr.options.backgroundColor = '#2d3748';
        toastr.options.textColor = '#f8f9fa';
    } else {
        $('body').removeClass('dark-mode').addClass('light-mode');
        localStorage.setItem('theme', 'light');
        // Update toastr for light mode
        // toastr.options.backgroundColor = '#6f03fc';
        // toastr.options.textColor = '#0d0c0d';
        toastr.options.backgroundColor = '#ffffff';
        toastr.options.textColor = '#212529';
    }
}

// Switch between tabs
function switchTab() {
    const target = $(this).data('bs-target');

    // Hide all sections
    $('#dashboard-section, #users-section, #posts-section').addClass('d-none');

    // Show the target section
    $(`#${target}-section`).removeClass('d-none');

    // Update active nav link
    $('.nav-link').removeClass('active');
    $(this).addClass('active');
}

// Toggle user favorite status
function toggleFavorite() {
    const userId = $(this).data('id');
    const index = favorites.indexOf(userId);

    if (index === -1) {
        favorites.push(userId);
        $(this).removeClass('text-secondary').addClass('text-warning');
        toastr.success('User added to favorites');
    } else {
        favorites.splice(index, 1);
        $(this).removeClass('text-warning').addClass('text-secondary');
        toastr.info('User removed from favorites');
    }

    // Save to localStorage
    saveToLocalStorage();
}

// View user details
function viewUser() {
    const userId = $(this).data('id');
    const user = users.find(u => u.id === userId);

    if (user) {
        $('#userModalTitle').text('User Details');
        $('#user-id').val(user.id);
        $('#user-name').val(user.name).prop('disabled', true);
        $('#user-username').val(user.username).prop('disabled', true);
        $('#user-email').val(user.email).prop('disabled', true);
        $('#user-phone').val(user.phone).prop('disabled', true);
        $('#user-website').val(user.website).prop('disabled', true);
        $('#save-user-btn').hide();

        $('#userModal').modal('show');
    }
}

// Edit user
function editUser() {
    const userId = $(this).data('id');
    const user = users.find(u => u.id === userId);

    if (user) {
        $('#userModalTitle').text('Edit User');
        $('#user-id').val(user.id);
        $('#user-name').val(user.name).prop('disabled', false);
        $('#user-username').val(user.username).prop('disabled', false);
        $('#user-email').val(user.email).prop('disabled', false);
        $('#user-phone').val(user.phone).prop('disabled', false);
        $('#user-website').val(user.website).prop('disabled', false);
        $('#save-user-btn').show();

        $('#userModal').modal('show');
    }
}

// Save user changes
function saveUser() {
    const userId = $('#user-id').val();
    const userIndex = users.findIndex(u => u.id == userId);

    if (userIndex !== -1) {
        // Update user data
        users[userIndex].name = $('#user-name').val();
        users[userIndex].username = $('#user-username').val();
        users[userIndex].email = $('#user-email').val();
        users[userIndex].phone = $('#user-phone').val();
        users[userIndex].website = $('#user-website').val();

        // Check if this is a local user
        const localUserIndex = localUsers.findIndex(u => u.id == userId);
        if (localUserIndex !== -1) {
            // Update local user
            localUsers[localUserIndex] = users[userIndex];
        } else {
            // Add to local users if it's a new user
            localUsers.push(users[userIndex]);
        }

        // Save to localStorage
        saveToLocalStorage();

        // Update DataTable
        $('#users-table').DataTable().row(userIndex).data(users[userIndex]).draw();

        $('#userModal').modal('hide');
        toastr.success('User updated successfully');
    }
}

// Delete user
function deleteUser() {
    const userId = $(this).data('id');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
        if (confirm('Are you sure you want to delete this user?')) {
            // Remove from users array
            const deletedUser = users.splice(userIndex, 1)[0];

            // Remove from local users if it exists there
            const localUserIndex = localUsers.findIndex(u => u.id === userId);
            if (localUserIndex !== -1) {
                localUsers.splice(localUserIndex, 1);
                saveToLocalStorage();
            }

            // Remove from favorites if present
            const favIndex = favorites.indexOf(userId);
            if (favIndex !== -1) {
                favorites.splice(favIndex, 1);
                saveToLocalStorage();
            }

            // Update DataTable
            $('#users-table').DataTable().clear().rows.add(users).draw();

            // Update dashboard count
            $('#users-count').text(users.length);

            toastr.success('User deleted successfully');
        }
    }
}

// Render posts
function renderPosts(postsToRender) {
    const postsContainer = $('#posts-container');
    postsContainer.empty();

    if (postsToRender.length === 0) {
        postsContainer.html('<div class="alert alert-info">No posts found</div>');
        return;
    }

    postsToRender.forEach(post => {
        const user = users.find(u => u.id === post.userId);
        const userName = user ? user.name : 'Unknown User';
        const postComments = comments.filter(c => c.postId === post.id);

        const postElement = `
                    <div class="card post-card animate__animated animate__fadeIn">
                        <div class="card-body">
                            <h5 class="card-title">${post.title}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">By: ${userName}</h6>
                            <p class="card-text">${post.body}</p>
                            <button class="btn btn-sm btn-info view-comments" data-id="${post.id}">
                                <i class="fas fa-comments me-1"></i> Comments (${postComments.length})
                            </button>
                            <button class="btn btn-sm btn-primary add-comment" data-id="${post.id}">
                                <i class="fas fa-plus me-1"></i> Add Comment
                            </button>
                            <button class="btn btn-sm btn-success edit-post" data-id="${post.id}">
                                <i class="fas fa-edit me-1"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger delete-post" data-id="${post.id}">
                                <i class="fas fa-trash me-1"></i> Delete
                            </button>
                            <div class="comments-section mt-3" id="comments-${post.id}" style="display: none;"></div>
                        </div>
                    </div>
                `;

        postsContainer.append(postElement);
    });
}

// Search posts
function searchPosts() {
    const searchText = $(this).val().toLowerCase();

    if (searchText.length === 0) {
        renderPosts(posts);
        return;
    }

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchText) ||
        post.body.toLowerCase().includes(searchText)
    );

    renderPosts(filteredPosts);
}

// View comments for a post
function viewComments() {
    const postId = $(this).data('id');
    const commentsSection = $(`#comments-${postId}`);

    // Toggle comments visibility
    if (commentsSection.is(':visible')) {
        commentsSection.slideUp();
        return;
    }

    // Get comments for this post
    const postComments = comments.filter(c => c.postId == postId);

    let commentsHtml = '<h6>Comments:</h6>';

    if (postComments.length === 0) {
        commentsHtml += '<p>No comments found</p>';
    } else {
        postComments.forEach(comment => {
            commentsHtml += `
                        <div class="comment">
                            <strong>${comment.name}</strong> (${comment.email})
                            <p>${comment.body}</p>
                        </div>
                    `;
        });
    }

    commentsSection.html(commentsHtml);
    commentsSection.slideDown();
}

// Add new comment
function addNewComment() {
    const postId = $(this).data('id');
    $('#comment-post-id').val(postId);
    $('#comment-name').val('');
    $('#comment-email').val('');
    $('#comment-body').val('');
    $('#commentModal').modal('show');
}

// Save comment
function saveComment() {
    const postId = $('#comment-post-id').val();
    const name = $('#comment-name').val();
    const email = $('#comment-email').val();
    const body = $('#comment-body').val();

    if (!name || !email || !body) {
        toastr.error('Please fill all fields');
        return;
    }

    const newComment = {
        id: Date.now(),
        postId: parseInt(postId),
        name: name,
        email: email,
        body: body
    };

    // Add to comments arrays
    comments.push(newComment);
    localComments.push(newComment);

    // Save to localStorage
    saveToLocalStorage();

    // Update UI
    $(`#comments-${postId}`).prepend(`
                <div class="comment">
                    <strong>${name}</strong> (${email})
                    <p>${body}</p>
                </div>
            `);

    // Update dashboard count
    $('#comments-count').text(comments.length);

    $('#commentModal').modal('hide');
    toastr.success('Comment added successfully');
}

// Add new post
function addNewPost() {
    $('#postModalTitle').text('Add New Post');
    $('#post-id').val('');
    $('#post-title').val('');
    $('#post-body').val('');

    // Populate user dropdown
    const userSelect = $('#post-user');
    userSelect.empty();
    userSelect.append('<option value="">Select a user</option>');
    users.forEach(user => {
        userSelect.append(`<option value="${user.id}">${user.name} (${user.email})</option>`);
    });

    $('#postModal').modal('show');
}

// Edit post
function editPost() {
    const postId = $(this).data('id');
    const post = posts.find(p => p.id === postId);

    if (post) {
        $('#postModalTitle').text('Edit Post');
        $('#post-id').val(post.id);
        $('#post-title').val(post.title);
        $('#post-body').val(post.body);

        // Populate user dropdown
        const userSelect = $('#post-user');
        userSelect.empty();
        users.forEach(user => {
            userSelect.append(`<option value="${user.id}" ${user.id === post.userId ? 'selected' : ''}>${user.name} (${user.email})</option>`);
        });

        $('#postModal').modal('show');
    }
}

// Save post
function savePost() {
    const postId = $('#post-id').val();
    const userId = $('#post-user').val();
    const title = $('#post-title').val();
    const body = $('#post-body').val();

    if (!userId) {
        toastr.error('Please select a user');
        return;
    }

    if (!title || !body) {
        toastr.error('Please fill all fields');
        return;
    }

    if (postId) {
        // Editing existing post
        const postIndex = posts.findIndex(p => p.id == postId);

        if (postIndex !== -1) {
            posts[postIndex].title = title;
            posts[postIndex].body = body;
            posts[postIndex].userId = parseInt(userId);

            // Check if this is a local post
            const localPostIndex = localPosts.findIndex(p => p.id == postId);
            if (localPostIndex !== -1) {
                // Update local post
                localPosts[localPostIndex] = posts[postIndex];
            } else {
                // Add to local posts if it's a new post
                localPosts.push(posts[postIndex]);
            }

            // Save to localStorage
            saveToLocalStorage();

            renderPosts(posts);
            $('#postModal').modal('hide');
            toastr.success('Post updated successfully');
        }
    } else {
        // Adding new post
        const newPost = {
            id: Date.now(), // Use timestamp for unique ID
            userId: parseInt(userId),
            title: title,
            body: body
        };

        posts.unshift(newPost);
        localPosts.unshift(newPost);

        // Save to localStorage
        saveToLocalStorage();

        renderPosts(posts);

        // Update dashboard count
        $('#posts-count').text(posts.length);

        $('#postModal').modal('hide');
        toastr.success('Post added successfully');
    }
}

// Delete post
function deletePost() {
    const postId = $(this).data('id');
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex !== -1) {
        if (confirm('Are you sure you want to delete this post?')) {
            // Remove from posts array
            const deletedPost = posts.splice(postIndex, 1)[0];

            // Remove from local posts if it exists there
            const localPostIndex = localPosts.findIndex(p => p.id === postId);
            if (localPostIndex !== -1) {
                localPosts.splice(localPostIndex, 1);
                saveToLocalStorage();
            }

            // Remove associated comments
            const commentsToRemove = comments.filter(c => c.postId === postId);
            comments = comments.filter(c => c.postId !== postId);
            localComments = localComments.filter(c => c.postId !== postId);
            saveToLocalStorage();

            renderPosts(posts);

            // Update dashboard count
            $('#posts-count').text(posts.length);
            $('#comments-count').text(comments.length);

            toastr.success('Post and its comments deleted successfully');
        }
    }
}


// Show loader
function showLoader() {
    $('#loader').fadeIn();
}

// Hide loader
function hideLoader() {
    $('#loader').fadeOut();
}