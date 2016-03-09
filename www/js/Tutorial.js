function startTutorial()
{
    if (!window.localStorage.getItem(LOCALSTORAGE_KEY_TUTORIAL))
    {
        window.localStorage.setItem(LOCALSTORAGE_KEY_TUTORIAL, "shown");
        $("#tutorial").crumble();
    }
}