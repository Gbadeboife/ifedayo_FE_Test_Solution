# ERGO BOOKING SYSTEM 

## SETUP Process
- You are expected to clone this repository and set up a new repo remotely on ur github with the code (Preferably name the repo with your name. E.g John_Doe_FE_Test_Soln) 
    To set up locally
    - **a.** clone the repo to your local machine 
    - **a.** update remote origin
    - **b.** install dependencies (using -- "npm install") 
    - **b.** run locally on your computer using this command - "npm run dev"

- Make sure to commit each fix with a valid message entailing what issue was fixed in the commit. This will help when grading your solution

- When you are done, cross check all fixes and then submit the repo that has your solutions. 

- Any commit after your submmission will be discarded and won't be graded.

- PLEASE make sure to deploy the app to a live server, to allow full test by the Development team and the Quality Assurance Team (preferably vercel)

## Table of Contents
1. [User Credentials](#user-credentials)
2. [Environment Variables](#environment-variables)
3. [Booking Status](#booking-status)
4. [Archive Status](#archive-status)
5. [Active Booking Details](#active-booking-details)
6. [Project Overview](#project-overview)
7. [Issues](#issues)

## User Credentials

### Host
- **Email:** fugnomuydi@gufum.com
- **Password:** Tamash!555

### Customer
- **Email:** joecus@gmail.com
- **Password:** Tamash!555

### Admin
- **Email:** adminergo@manaknight.com
- **Password:** a123456

## Environment Variables
- **VITE_REACT_STRIPE_PUBLIC_KEY:** `pk_test_51Ll5ukBgOlWo0lDUrBhA2W7EX2MwUH9AR5Y3KQoujf7PTQagZAJylWP1UOFbtH4UwxoufZbInwehQppWAq53kmNC00UIKSmebO`
- **VITE_GOOGLE_API_KEY:** CREATE ONE YOURSELF
- **VITE_RECAPTCHA_SITE_KEY:** CREATE ONE YOURSELF

## Booking Status
- **PENDING**
- **UPCOMING**
- **ONGOING**
- **COMPLETED**
- **DECLINED**
- **CANCELLED**
- **DELETED**

## Archive Status
- **IS_ARCHIVE:** 1
- **NOT_ARCHIVE:** 0

## Active Booking Details
- An active booking has the following details:
    {
        "addon_cost",
        "id",
        "create_at",
        "update_at",
        "property_space_id",
        "customer_id",
        "host_id",
        "stripe_payment_intent_id",
        "booked_unit",
        "payment_method",
        "status",
        "payment_status",
        "booking_start_time",
        "booking_end_time",
        "duration",
        "queued",
        "tax_rate",
        "commission_rate",
        "num_guests",
        "reason",
        "deleted_at",
        "host_first_name",
        "host_last_name",
        "customer_first_name",
        "customer_last_name",
        "property_id",
        "property_name",
        "space_category",
        "image_url",
        "hourly_rate",
        "rate",
        "tax",
        "commission",
        "total",
        "address_line_1",
        "address_line_2",
        "property_spaces_id",
        "property_city",
        "property_country",
        "email",
        "host_email"
    }


#### The Issues Are Listed Below

1.  When u log in using the host credentials, In the host property space page, u will find two active property spaces. 
    Then Log in via another browser (or Incognito mode) using the customer credentials,on the Home page, navigate to "/explore?section=new-spaces" and search for "Lili" property space (which belongs to the host). 

    Create a booking as a customer on the "Lili" Property space, select the available time slots, proceed to make payment and confirm booking. 

    Then switch to the host account and navigate to "/account/my-bookings" route, You will see the booking you just created as a customer. Approve the bookings made from customers.

    Now the issues here are that:
    - **a.** It allows the fromTime to be greater than ToTime (For example, u can select a booking time by 6pm and end by 5pm). There is a comment that tells you to add  a code that will should fix that.

    - **b.** Upcoming/Ongoing customers bookings slot time for the property space should be disabled when a customer is selecting time slots for a new booking to prevent new bookings clashing with such slot times

    Please fix these issues. (Tip - There are in DateTimePicker.jsx file)

2.  Inside AddCardMethodModal.jsx (route - "/account/billing"), add a simple UI Modal for adding new cards. 
    On filling it, make sure errors are checked, cards should be submitted to DB through "addNewCard" function. 

3.  SpaceDetailsTwo.jsx is a file that contains logic for completing the second step when creating a property space.
    (In this step, we add images, amenities, addons, FAQs for the property space)

    - **a.** Using FileUploader library, allow max of 6 images, each image should not exceed
    1MB, and allow preview of images when selected.

    - **b.** using the #append_faq_btn btn, add logic that allows more faqs UI (question and answer) to be appended to the fields prop from useFieldArray when the btn is clicked.

4.  In Signup Page, either as a host or a customer. One step is missing -  A Recaptcha feature.

    Please add a recaptcha feature, that disallows the submit button if user hasn't perform the recaptcha step.

    Also please make sure that a valid email is submitted.

5.  The CustomStaticLocationAutoCompleteV2.jsx file component currently has an issue. 
    It doesn't show the user typed in text. When I type in a location, Is not visible in the searh input. Please Fix it.

6.  As a logged in User (Either as Host or Customer) - From the HostProfilePage.jsx and CustomerProfilePage.jsx. 

    - **a.** Please add a prompt modal to comfirm if user wants to remove a profile picture

    - **b.** Please add a modal to preview selected image from user device (when user intends to update profile picture) and then proceed to update profile picture OR close modal if otherwise

7.  Please make sure u initiate chat from the bookings page (/account/my-bookings).

    Inside MessagePage.jsx file. There is a sendMessage function. Before a message is sent, check to make sure that the following are adhere to: 

    - **a.** No sharing of links, urls or the use of profane langauges

    - **b.** if selected booking (activeBooking) ISN'T ongoing (ONGOING state), don't allow sharing of phone number or email

    - **c.** if selected booking (activeBooking) messages between host and customer is up to three(3) and booking is not ongoing, don't allow new messages to be sent

    - **d.** from the badWords.json file, make sure the message to be sent doesn't contain any word from the file.

    Note that, with the host and customer account credentials, u can login and create bookings.

8.  For every account, there is a message feature. 
    For example, if u login using the customer credentials and proceed to this route - "/account/messages?message_tab=inbox", you will find the messages between the user and other users.

    Now each chat can be archived and unarchived. We have the UI for it. But we need the API implementation. Under MessagePage.jsx file, you will find two defined functions (archiveRoom and UnarchiveRoom)

    Payload sample
    {
        "id": active_room_id,
        "is_archive": 0 || 1
    }

    SO please implement them, and then update selected room chat on API success. And switching of tabs, showing the selected room chat.

9.  When logged in as a Host User, Navigate to the host spaces tab. You will find a draft property space ("Draft Space")

    Click on "view details", You will then be redirected to the "property space details page", 
    Click on "About location", and then the space details page (name, location, rate, rules, etc) will be fetched.

    Now the issue here, is that the details are not loaded into the input UI that we have. (since it is a draft space that has these details saved already and its been fetched).

    Please fix the issue - preload the space details into the UI that we have

10. Tour Guide Issue - Logged in as either host or customer. 
    Click on the avater icon on the far right hand, and on the drop down menu, click on "Help me get started", You will be given a tour of the App. But we got issues:

    Step 6 - should navigate to "/account/verification", and place the modal at the bottom of the page

    Step 7 - 
    - **a.** should highlight the "Submit Document" Button in "/account/verification" route. 

    - **b.** Add heading text to the tour modal - "Click the submit button"

    - **c.** A body text - "Once approved, you will receive an email with approval confirmation from our support team and your account will be activated. For questions or concerns, please navigate to the <Link to="/faq">FAQs</Link> page."

    - **d.** allow going to both next and previous steps

11. When user is signing up. On the "Finish Signing up page"
    - **a.** User needs to agree to "Terms and Conditions"

    - **b.** open Privacy and Policy Modal and read to the end

    - **c.** DOB must be at least 18 years

    - **d.** first and lastName are required
    
    - **e.** Password must be
        i. at least 10 characters long
        ii. Contain at least one digit, one lowercase, one upercase, one symbol
        iii. from the common-passwords.json file, make sure password doesn't contain any word from there.
        iv. mustn't contain the entered first name, last name or DOB.

        Show these errors as user is inputting the password (incase it matches any)

    In simpler terms, disabled the button till the red flags are passed.


