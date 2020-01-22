$(function() {
    var store = new PouchDB('example');

    $('#contactForm').submit(function(event) {
        event.preventDefault();

        var name = $('#name').val();
        var email = $('#email').val();
        var mobile = $('#mobile').val();

        // Save the contact to the database
        store.post({
            name: name,
            mobile: mobile,
            email: email
        });

        $('#contactForm')[0].reset();
    });

    //add new contact to the page
    function addContact(record) {
        var contact = record.doc;
        var newContact = '<tr><td>' + contact.name + '</td><td>' + contact.mobile +
            '</td><td>' + contact.email + '</td></td><td>' +
            '<button type="button" class="btn btn-default" data-id="' + contact._id +
            '">Delete</button>' +
            '</td></tr>';
        $("#contactList tbody").append(newContact);
    }

    function deleteContact(id) {
        store.get(id).then(function(doc) {
            store.remove(doc).then(console.log).catch(console.log);
        });
    }

    function loadContacts() {
        return store.allDocs({ include_docs: true }).then(function(contacts) {
            $("#contactList tbody").html('');
            $.each(contacts.rows, function(i, record) {
                addContact(record);
            });
        });
    }

    function processChange(record) {
        if (record.doc._deleted) {
            // re-render entire list
            loadContacts();
        } else {
            addContact(record);
        }
    }

    $("#contactList").on('click', function(event) {
        event.preventDefault();
        var id = $(event.target).attr('data-id');
        deleteContact(id);
    });

    // when a new entry is added to/removed from the database, update the contact list.
    store.changes({
        since: 'now',
        live: true,
        include_docs: true
    }).on('change', processChange);

    // when the site loads we load all previously saved contacts from the local database.
    var promise = loadContacts();

    // Now continuously synchronize with the Sync Gateway this will trigger the store.changes() listener.
    // Retry connection if the connection is/goes down (uses backoff strategy).
    promise.then(function() {
        store.sync('http://127.0.0.1:4984/example', {
            live: true,
            retry: true
        });
    });
});