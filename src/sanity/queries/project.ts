export const projectProjection = `
  _id,

  title,
  slug,
  year,

  description,
  context,
  role,

  status,
  organization,

  categories[]->{
    _id,
    name,
    slug,
    order
  },

  technologies,

  team[]{
    name,
    role
  },

  cover{
    _type,

    image{
      asset->{
        _id,
        url,
        metadata{
          dimensions{
            width,
            height
          }
        }
      }
    },

    alt
  },

  media[]{
    _type,

    _type == "projectImage" => {
      image{
        asset->{
          _id,
          url,
          metadata{
            dimensions{
              width,
              height
            }
          }
        }
      },

      alt
    },

    _type == "projectVideo" => {
      video{
        asset->{
          _id,
          url
        }
      }
    }
  },

  github,
  liveSite,

  playable{
    type,
    source
  },

  featured,
  order,

  seo{
    title,
    description
  }
`;